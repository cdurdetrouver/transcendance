import json
import re
import asyncio

from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async

from user.utils import get_user_by_token
from user.serializers import UserSerializer
from .game import GameThread
from .models import FlappyGame

class FlappyMatchmakingConsumer(AsyncWebsocketConsumer):

    waiting_players = []

    async def connect(self):
        access_token = self.scope['cookies'].get('access_token')

        success, result = await sync_to_async(get_user_by_token)(access_token)
        await self.accept()
        if not success:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': result
            }))
            await self.close()
            return
        self.user = result
        self.blocked_users = await sync_to_async(list)(self.user.blocked_users.all())

        for player in self.waiting_players:
            if player.user == self.user:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'You are already in the waiting list'
                }))
                await self.close()
                return

        self.waiting_players.append(self)

        if len(self.waiting_players) >= 2:
            if self.waiting_players[0].user in self.waiting_players[1].blocked_users or self.waiting_players[1].user in self.waiting_players[0].blocked_users:
                return
            player1 = self.find_and_remove_unblocked_player()
            if player1 is None:
                return
            self.waiting_players.remove(self)
            player2 = self

            game_room_name = f"game_room_{player1.channel_name}_{player2.channel_name}"
            game_room_name = re.sub(r'[^a-zA-Z0-9._-]', '', game_room_name)[:50]

            game = await sync_to_async(FlappyGame.objects.create)(room_name=game_room_name , player1=player1.user, player2=player2.user)
            await sync_to_async(game.save)()

            await player1.send(text_data=json.dumps({
                'type': 'match_found',
                'game_room': game_room_name,
                'game_id': game.id,
                'opponent': UserSerializer(player2.user).data,
            }))
            await player2.send(text_data=json.dumps({
                'type': 'match_found',
                'game_room': game_room_name,
                'game_id': game.id,
                'opponent': UserSerializer(player1.user).data,
            }))

    async def disconnect(self, close_code):
        if self in self.waiting_players:
            self.waiting_players.remove(self)

    def find_and_remove_unblocked_player(self):
        for i, player in enumerate(self.waiting_players):
            blocked = False
            if self.user in player.blocked_users:
                blocked = True
            if not blocked:
                return self.waiting_players.pop(i)
        return None

class FlappyConsumer(AsyncWebsocketConsumer):

    games = {}
    waiting_players = []

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.room_group_name = None
        self.game = None
        self.GameThread = None

    async def connect(self):
        access_token = self.scope['cookies'].get('access_token')
        success, result = await sync_to_async(get_user_by_token)(access_token)
        await self.accept()
        if not success:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': result
            }))
            await self.close()
            return

        self.user = result
        for player in self.waiting_players:
            if player.user == self.user:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'You are already in the waiting list'
                }))
                await self.close()
                return

        self.room_group_name = self.scope['url_route']['kwargs']['room_name']
        self.game = await sync_to_async(FlappyGame.objects.get)(room_name=self.room_group_name)
        await sync_to_async(lambda: self.game.player1)()
        await sync_to_async(lambda: self.game.player2)()
        await sync_to_async(lambda: self.game.winner)()

        # No one can join when game as started
        if self.game.started:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Game has already started'
            }))
            await self.close()
            return

        if self.game.finished:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Game has already finished'
            }))
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await asyncio.sleep(1)
        self.waiting_players.append(self.user.id)
        self.player = 'player1' if self.user == self.game.player1 else 'player2'
        await self.send(text_data=json.dumps({
            'type': 'waiting',
            'message': 'Waiting for opponent to join',
            'game_id': self.game.id
        }))

        if not self.game.started and self.game.player1.id in self.waiting_players and self.game.player2.id in self.waiting_players:
            self.waiting_players.remove(self.game.player1.id)
            self.waiting_players.remove(self.game.player2.id)
            try :
                self.GameThread = GameThread(self.game, self.room_group_name, self.channel_layer)
                self.games[self.room_group_name] = self.GameThread
                self.GameThread.start()
                self.game.started = True
                await sync_to_async(self.game.save)()
            except Exception as e:
                print("this error", e)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'game.error',
                        'message': 'Failed to start game',
                    }
                )
                return

    async def disconnect(self, close_code):
        if not self.user:
            return
        else:

            if self.room_group_name in self.games:
                self.GameThread.stop(self.user)
                del self.games[self.room_group_name]
            if self.GameThread :
                del self.GameThread
                self.GameThread = None

            self.game = await sync_to_async(FlappyGame.objects.get)(room_name=self.room_group_name)
            await sync_to_async(lambda: self.game.winner)()
            await sync_to_async(self.game.save)()
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game.end',
                    'message': 'Opponent left the game',
                    'winner' : self.game.winner.id
                }
            )
            self.game.nb_players -= 1
            await sync_to_async(self.game.save)()
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):

        data = json.loads(text_data)

        if data["message"] == "ping":
            await self.send(text_data=json.dumps({
                'type': 'pong'
            }))
        elif data["message"] == "jump":
            await self.GameThread.set_player_jump(self.player, data)

    async def game_error(self,event):
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': event['message'],
        }))
        self.game = await sync_to_async(FlappyGame.objects.get)(room_name=self.room_group_name)
        self.game.finished = True
        await sync_to_async(self.game.save)()
        if self.room_group_name in self.games:
            del self.games[self.room_group_name]
        if self.GameThread :
            del self.GameThread
            self.GameThread = None
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        await self.close()

    async def game_started(self, event):
        self.GameThread = self.games[self.room_group_name]
        await self.send(text_data=json.dumps({
            'type': 'game_started',
            'message': 'Game has started'
        }))

    async def game_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_update',
            'message': event['message']
        }))

    async def game_end(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_end',
            'message': event['message'],
            'winner': event['winner']
        }))
        if self.room_group_name in self.games:
            del self.games[self.room_group_name]
        if self.GameThread :
            del self.GameThread
            self.GameThread = None
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        await self.close()

    async def game_looser(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_loose',
            'message': event['message'],
            'winner': event['winner']
        }))
