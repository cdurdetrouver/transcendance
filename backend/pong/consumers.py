import json
import re
import asyncio

from channels.generic.websocket import AsyncWebsocketConsumer

from user.utils import get_user_by_token
from pong.models import Game
from asgiref.sync import sync_to_async
from user.serializers import UserSerializer
from .game import GameThread

class MatchmakingConsumer(AsyncWebsocketConsumer):

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
        self.waiting_players.append(self)

        if len(self.waiting_players) >= 2:
            player1 = self.waiting_players.pop(0)
            player2 = self.waiting_players.pop(0)

            game_room_name = f"game_room_{player1.channel_name}_{player2.channel_name}"
            game_room_name = re.sub(r'[^a-zA-Z0-9._-]', '', game_room_name)[:50]
            print(game_room_name)

            game = await sync_to_async(Game.objects.create)(room_name=game_room_name , player1_id=player1.user.id, player2_id=player2.user.id)
            await sync_to_async(game.save)()

            await player1.send(text_data=json.dumps({
                'type': 'match_found',
                'game_room': game_room_name,
                'opponent': UserSerializer(player2.user).data,
            }))
            await player2.send(text_data=json.dumps({
                'type': 'match_found',
                'game_room': game_room_name,
                'opponent': UserSerializer(player1.user).data,
            }))

    async def disconnect(self, close_code):
        if self in self.waiting_players:
            self.waiting_players.remove(self)

class PongConsumer(AsyncWebsocketConsumer):

    games = {}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.room_group_name = None
        self.game = None
        self.type = None
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
        self.room_group_name = self.scope['url_route']['kwargs']['room_name']
        self.game = await sync_to_async(Game.objects.get)(room_name=self.room_group_name)

        if self.game.finished:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Game has already finished'
            }))
            await self.close()
            return

        if (self.user.id != self.game.player1_id and self.user.id != self.game.player2_id):
            self.game.nb_viewers += 1
            await sync_to_async(self.game.save)()
            await self.send(text_data=json.dumps({
                'type': 'viewer',
                'message': 'You are not a player in this game',
                'game_id': self.game.id
            }))
            self.type = 'viewer'
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        else:
            self.type = 'player'
            self.game.nb_players += 1
            await sync_to_async(self.game.save)()
            await self.send(text_data=json.dumps({
                'type': 'waiting',
                'message': 'Waiting for opponent to join',
            }))
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        if not self.game.started and self.game.nb_players == 2:
            self.GameThread = GameThread(self.game, self.room_group_name, self.channel_layer)
            self.games[self.room_group_name] = self.GameThread
            self.GameThread.start()
            print("test", self.GameThread)

    async def disconnect(self, close_code):
        if self.type == 'viewer':
            self.game.nb_viewers -= 1
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
            return

        self.game.nb_players -= 1
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game.end',
                'message': 'Opponent left the game'
            }
        )
        if self.game.nb_players == 0:
            del self.GameThread

    async def receive(self, text_data):
        if self.type == 'viewer':
            return

        try :
            self.GameThread.set_player_direction(self.user.id, json.loads(text_data))
        except Exception as e:
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
            'message': event['message']
        }))
        self.game.finished = True
        self.game.save()
        del self.games[self.room_group_name]
        del self.GameThread

