import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .serializers import MessageSerializer
from .models import Message, Room, User
from django.conf import settings
from rest_framework import exceptions
from rest_framework.response import Response
from .data_handling import get_user, get_room, in_room, add_in_room, get_last_10_messages, save_message

class ChatConsumer(AsyncWebsocketConsumer):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room = None
        self.user = None

    async def connect(self):
        # self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = "chat_bonjour"
        self.user = await get_user(self.scope)
        if self.user is None:
            raise exceptions.AuthenticationFailed('User not found')
        elif not self.user.is_active:
            raise exceptions.AuthenticationFailed('user is inactive')
        else:
            await self.accept()
                    # Join room group
            await self.channel_layer.group_add(
            self.room_group_name, self.channel_name)
            room = await get_room(self.room_group_name)
            if (await in_room(room, self.user.username) == False):
                await add_in_room(room, self.user)
                self.room = room
                await self.send(text_data=json.dumps({"announce": "Welcome in chat: " + self.room_group_name}))
                print("connect")
            else:
                messages = await get_last_10_messages(room)
                # async for message in messages:
                #     await self.send_message(message.content)

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name, self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        print("receive", text_data)
        text_data_json = json.loads(text_data)
        print(text_data_json)
        message = await database_sync_to_async(Message.objects.create)(author=self.user.id, message_type="chat",content=text_data_json["message"] )
        # username = text_data_json["username"]
        await save_message(self.room, text_data_json)
        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name, {"type": "chat","message" : message}
        )

    async def send_message(self, message):
        await self.send(text_data=json.dumps({"message": message}))

    # Receive message from room group
    async def chat_message(self, event):
        message = event["message"]
        print(message)
        # Send message to WebSocket
        await self.send_message(message)

