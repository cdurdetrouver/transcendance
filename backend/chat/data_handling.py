from .models import Message, Room, User
from django.conf import settings
import json
from channels.db import database_sync_to_async
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .serializers import MessageSerializer
from rest_framework import exceptions
import jwt
from django.utils import timezone
from user.utils import get_from_cookies
from asgiref.sync import sync_to_async

@database_sync_to_async
def get_user(user_id):
    return get_object_or_404(User, id=user_id)

@database_sync_to_async
def get_room(room_id):
    try:
        room = get_object_or_404(Room, name=room_id)
    except:
        room = Room.objects.create(name=room_id)
    return room

@database_sync_to_async
def in_room(room, user_id):
    try:
        room.participants_id.index(user_id)
        return True
    except:
        return False

@database_sync_to_async
def add_in_room(room, user_id):
    room.participants_id.append(user_id)
    room.save()

@database_sync_to_async
def get_mess(mess_id):
    return get_object_or_404(Message, id=mess_id)

@database_sync_to_async
def get_last_10_messages(room, nb_refresh):
    ids = room.messages_id[-10 * nb_refresh:]
    print(ids)
    messages = []
    for id in ids:
        messages.append(get_object_or_404(Message, id=id))
    messages_s = MessageSerializer(messages, many=True)
    return messages_s.data

@database_sync_to_async
def save_message(room, text_data_json, user):
    content = text_data_json["message"]
    message = Message.objects.create(author_id=user.id, message_type="chat", content=content)
    room.messages_id.append(message.id)
    room.save()
    message.save()
    return message
