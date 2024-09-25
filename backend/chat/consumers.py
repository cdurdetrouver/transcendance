import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .serializers import MessageSerializer
from .models import Message, Room, User
from django.conf import settings
from rest_framework import exceptions
from asgiref.sync import sync_to_async
from user.utils import get_user_by_token
from user.serializers import UserSerializer
from rest_framework.response import Response
from .data_handling import get_room, in_room, add_in_room, get_last_10_messages, save_message, get_user

class ChatConsumer(AsyncWebsocketConsumer):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room = None
        self.refresh = 0
        self.user = None

    async def connect(self):
        # self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = "chat_pets"
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
        self.room = await get_room(self.room_group_name)
        if (await in_room(self.room, self.user.id) == False):
            await add_in_room(self.room, self.user.id)
            self.room = await get_room(self.room_group_name)
            await self.channel_layer.group_add(
                self.room_group_name, self.channel_name)
            await self.send(text_data=json.dumps({"type": "announce", "content": "Welcome in chat: " + self.room_group_name}))
            await self.channel_layer.group_send(
                self.room_group_name, {"type": "announce.message", "announce" : self.user.username + " as joined the chat"})
        else:
            await self.refresh_last_mess()
        await self.channel_layer.group_add(
            self.room_group_name, self.channel_name)
        self.refresh = 0

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name, self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = await save_message(self.room, text_data_json, self.user)
        message_serializer = MessageSerializer(message)
        
        # Send message to room group
        if (text_data_json["type"] == "refresh_mess"):
            await self.refresh_last_mess()
        else:
            await self.channel_layer.group_send(
                self.room_group_name, {"type": "chat.message", "message" : message_serializer.data})

    # Receive message from room group
    async def chat_message(self, event):
        message = event["message"]
        user_s = UserSerializer( await get_user(message['author_id']))
        # Send message to WebSocket
        await self.send(text_data=json.dumps({"type" : "chat", "user" : user_s.data, "message": message}))

    async def announce_message(self, event):
        announce = event ["announce"]
        await self.send(text_data=json.dumps({"type" : "announce", "content": announce}))

    async def refresh_last_mess(self):
        self.refresh += 1
        messages = await get_last_10_messages(self.room, self.refresh)
        # print(messages)
        await self.send(text_data=json.dumps({"type" : "list-chat", "messages": messages}))