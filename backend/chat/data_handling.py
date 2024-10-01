from .models import Message, Room, User
from django.conf import settings
import json
from channels.db import database_sync_to_async
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from user.serializers import UserSerializer
from .serializers import MessageSerializer
from rest_framework import exceptions
import jwt
from django.utils import timezone
from user.utils import get_from_cookies
from asgiref.sync import sync_to_async

@database_sync_to_async
def get_user(user_id):
    return get_object_or_404(User, id=user_id)

def room_exists(room_name):
    print(room_name)
    try:
        room = get_object_or_404(Room, name=room_name)
        return True
    except:
        return False

@database_sync_to_async
def get_room(room_id):
    try:
        room = get_object_or_404(Room, id=room_id)
        return room
    except:
        return None

@database_sync_to_async
def in_room(room, user):
    if (room.participants.filter(id=user.id).exists()):
        return True
    return False

@database_sync_to_async
def add_in_room(room, user):
    room.participants.add(user)
    room.save()

@database_sync_to_async
def get_mess(mess_id):
    return get_object_or_404(Message, id=mess_id)

@database_sync_to_async
#refresh a partir de start 
def get_last_10_messages(room, nb_refresh, starts):
    return 1

@database_sync_to_async
def save_message(room, text_data_json, user):
    content = text_data_json["message"]
    message = Message.objects.create(author=user, message_type="chat", content=content)
    room.messages.add(message)
    room.save()
    message.save()
    return message
