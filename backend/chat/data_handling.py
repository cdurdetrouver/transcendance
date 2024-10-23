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

@database_sync_to_async
def is_blocked(user, author_id):
    if user.blocked_users.filter(id=author_id).all().first():
        return True
    return False


@database_sync_to_async
def get_user_by_name(username):
    return get_object_or_404(User, username=username)

@database_sync_to_async
def get_room(room_id):
    room = Room.objects.filter(id=room_id).all().first()
    return room

@database_sync_to_async
def in_room(room, user):
    if not room.participants.filter(id=user.id).first():
        return False
    return True

@database_sync_to_async
def add_in_room(room, user):
    room.participants.add(user)
    room.save()

@database_sync_to_async
def remove_from_room(room, user):
    room.participants.exclude(id=user.id)
    room.save()

@database_sync_to_async
def get_mess(mess_id):
    return get_object_or_404(Message, id=mess_id)

@database_sync_to_async
def get_last_10_messages(room, nb_refresh, starts, user):
    start = None
    end_history = False

    all_mess = room.messages.order_by('send_at').all()
    if (nb_refresh == 1):
        starts = start = len(all_mess)
    if ((starts - (10 * nb_refresh)) < 0 and  (starts - (10 * (nb_refresh - 1))) < 0):
            return [], starts, True
    if (starts > 10):
        begin = starts - (10 * nb_refresh) if starts - (10 * nb_refresh) >= 0 else  0
        last_mess = all_mess[begin: starts - (10 * (nb_refresh - 1))]
    else:
        last_mess = all_mess
        end_history = True

    mess_s = MessageSerializer(last_mess, many=True)
    for mess in mess_s.data:
        if user.blocked_users.filter(id=mess["author"]["id"]).all().first():
            mess["content"] = "undefined"
    return mess_s.data,start, end_history

@database_sync_to_async
def save_message(room, text_data_json, user):
    content = text_data_json["message"]
    message = Message.objects.create(author=user, message_type="chat", content=content)
    room.messages.add(message)
    room.save()
    message.save()
    return message
