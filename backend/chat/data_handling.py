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
def get_room(room_id):
    try:
        room = get_object_or_404(Room, name=room_id)
    except:
        room = Room.objects.create(name=room_id)
    return room

@database_sync_to_async
def in_room(room, user_name):
    name = room.participants.filter(username=user_name).first()
    if (name):
        return True
    return False

@database_sync_to_async
def add_in_room(room, user):
    room.participants.add(user)
    room.save()

@database_sync_to_async
def get_last_10_messages(room, nb_refresh):
    # if len(room.messages.all()) > nb_refresh * 10:
    #     return room.messages.all()[len(room.messages.all()) - (nb_refresh * 10):len(room.messages.all()) - ((nb_refresh - 1) * 10)]
    # else:
    messages = []
    for message in room.messages.all():
        messages.append(message)

    return messages

@database_sync_to_async
def save_message(room, text_data_json, user):
    # message = MessageSerializer(text_data_json)
    content = text_data_json["message"]
    message = Message.objects.create(author=user, message_type="chat", content=content)
    room.messages.add(message)
    room.save()
    return message
