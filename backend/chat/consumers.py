# chat/consumers.py
import json
import jwt
from asgiref.sync import async_to_sync, sync_to_async
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.shortcuts import get_object_or_404
from .models import Message, Room, User
from django.conf import settings
from rest_framework import exceptions
from encodings import undefined

@database_sync_to_async
def get_user(scope):
        access_token = scope['subprotocols'][1]
        print(scope)
        payload = jwt.decode(
				access_token, settings.SECRET_KEY, algorithms=['HS256'])
        #error ? 
        print("access_token : " + access_token)
        user = User.objects.filter(id=payload['user_id']).first()
        return (user)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = "chat_bonjour"
        user = await get_user(self.scope)
        if user is None:
            raise exceptions.AuthenticationFailed('User not found')
        elif not user.is_active:
            raise exceptions.AuthenticationFailed('user is inactive')
        
        else:
            await self.accept()
                    # Join room group
            await self.channel_layer.group_add(
            self.room_group_name, self.channel_name)
            await self.send(text_data=json.dumps({"message": "bonjour"}))
        #check if register
        #if pour join mess

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name, self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]
        # current_room = get_object_or_404(Room, id='Room.id')
        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name, {"type": "chat.message", "message": message}
        )

    # Receive message from room group
    async def chat_message(self, event):
        message = event["message"]

        # Send message to WebSocket
        await self.send(text_data=json.dumps({"message": message}))