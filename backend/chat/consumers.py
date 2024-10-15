import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .serializers import MessageSerializer
from .models import Message, Room, User
from django.conf import settings
from rest_framework import exceptions
from rest_framework.response import Response
from asgiref.sync import sync_to_async
from user.utils import get_user_by_token
from user.serializers import UserSerializer
from .data_handling import get_room, in_room, add_in_room, get_last_10_messages, save_message, is_blocked

class ChatConsumer(AsyncWebsocketConsumer):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room = None
        self.refresh = 0
        self.refresh_start = None
        self.refresh_stop = False
        self.user = None

    async def set_user(self):
        await add_in_room(self.room, self.user)
        await self.channel_layer.group_add(
            self.room_group_name, self.channel_name)
        await self.send(text_data=json.dumps({"type": "announce", "content": "Welcome in chat: " + self.room_group_name}))
        await self.channel_layer.group_send(
            self.room_group_name, {"type": "announce.message", "announce" : self.user.username + " as joined the chat"})

    async def error(self, error):
        if not error:
            error = self.error_mess
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': error
        }))
        self.room_group_name = 'failed'
        await self.close()
        return -1

    async def check_user(self):
        access_token = self.scope['cookies'].get('access_token')
        success, result = await sync_to_async(get_user_by_token)(access_token)
        await self.accept()
        if not success:
            return await self.error(result)
        self.user = result

    async def connect(self):
        self.room_group_id = self.scope["url_route"]["kwargs"]["room_id"]
        if (await self.check_user() == -1):
            return
        self.room = await get_room(self.room_group_id)
        self.room_group_name = await sync_to_async(lambda: self.room.group_name)()
        if (not self.room):
            await self.disconnect(404)
            return
        if (await in_room(self.room, self.user) == False):
            return await self.error("User is not register in room: {}".format(
                self.room.name))
        else:
            await self.refresh_last_mess()
        await self.channel_layer.group_add(
            self.room_group_name, self.channel_name)

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name, self.channel_name
        )

    async def chat_invitation(self):
        pass

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)

        # Send message to room group
        if (text_data_json["type"] == "refresh_mess"):
            await self.refresh_last_mess()
        elif text_data_json["type"] == "chat":
            message = await save_message(self.room, text_data_json, self.user)
            message_serializer = MessageSerializer(message)
            await self.channel_layer.group_send(
                self.room_group_name, {
                    "type": "chat.message", "message" : message_serializer.data})
        elif text_data_json["type"] == 'invitation':
            await self.channel_layer.group_send(
                self.room_group_name, {
                    "type": "chat.invitation"})

    # Receive message from room group
    async def chat_message(self, event):
        message = event["message"]
        # Send message to WebSocket
        if await is_blocked(self.user, message['author']['id']):
            message["content"] = "undefined"
        await self.send(text_data=json.dumps({"type" : "chat", "message": message}))

    async def announce_message(self, event):
        announce = event ["announce"]
        await self.send(text_data=json.dumps({"type" : "announce", "content": announce}))

    async def refresh_last_mess(self):
        self.refresh += 1
        if self.refresh_stop:
            messages = []
        else:
            messages, start, self.refresh_stop = await get_last_10_messages(
                self.room, self.refresh, self.refresh_start, self.user)
            if (start != None):
                self.refresh_start  = start
        await self.send(text_data=json.dumps({"type" : "list-chat", "messages": messages}))
