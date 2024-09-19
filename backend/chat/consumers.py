import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Message, Room, User
from django.conf import settings
from rest_framework import exceptions
from rest_framework.response import Response
from .data_handling import get_user, get_room, in_room, add_in_room, get_last_10_messages, save_message

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
            room = await get_room(self.room_group_name)
            if (await in_room(room, user.username) == False):
                print("welcome in " + self.room_group_name + " to ")
                await add_in_room(room, user)
                await self.send(text_data=json.dumps({"message": "Welcome in chat: " + self.room_group_name}))
            else:
                messages = await get_last_10_messages(room)
                async for message in messages:
                    print("send history : " + message.content)
                    await self.send_message(message.content)

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name, self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        content = text_data_json["message"]
        # username = text_data_json["username"]
        room = await get_room(self.room_group_name)
        await save_message(room, text_data_json)
        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name, {"type": "chat.message", "message": content}
        )

    async def send_message(self, message):
        print("send :" + message)
        await self.send(text_data=json.dumps({"message": message}))

    # Receive message from room group
    async def chat_message(self, event):
        message = event["message"]
        # Send message to WebSocket
        await self.send_message(message)

