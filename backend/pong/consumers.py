import json

from channels.generic.websocket import AsyncWebsocketConsumer

from user.utils import get_user_by_token
from pong.models import Game
from asgiref.sync import sync_to_async
from user.serializers import UserSerializer

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
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"pong_{self.room_name}"
        self.game = await sync_to_async(Game.objects.get)(room_name=self.room_name)

        if self.user.id != self.game.player1_id and self.user.id != self.game.player2_id:
            await self.send(text_data=json.dumps({
                'type': 'viewer',
                'message': 'You are not a player in this game'
            }))
            self.type = 'viewer'
        else:
            self.type = 'player'
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'disconnect',
                'user': self.user.id
            }
        )
        self.game.delete()

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        game_data = text_data_json['game_data']

        if self.type == 'player':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_update',
                    'game_data': game_data
                }
            )

    async def game_update(self, event):
        game_data = event['game_data']
        await self.send(text_data=json.dumps({
            'type': 'game_update',
            'game_data': game_data
        }))
