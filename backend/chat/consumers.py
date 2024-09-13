# chat/consumers.py
import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import AsyncWebsocketConsumer
from django.shortcuts import get_object_or_404
from .models import Message, Room

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = "chat_bonjour"
        acces_token = self.scope['subprotocols'][1]
        print("acces_token : " + acces_token)
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name, self.channel_name)

        await self.accept()
        #check if register
        #if pour join mess
        await self.send(text_data=json.dumps({"message": "bonjour"}))


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