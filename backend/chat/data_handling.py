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


@database_sync_to_async
def get_user(scope):
    try :
        cookies = scope["headers"][10]
    except :
        return None
    if not cookies:
        return None
    try :
        cookies = str(cookies[1].decode('utf-8'))
        access_token = get_from_cookies(cookies, 'access_token')
        if not access_token:
            return None
        payload = jwt.decode(
			access_token, settings.SECRET_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        raise exceptions.AuthenticationFailed('access_token expired')
    except IndexError:
        raise exceptions.AuthenticationFailed('Token prefix missing')        
    user = User.objects.filter(id=payload['user_id']).first()
    if user is None:
        raise exceptions.AuthenticationFailed('User not found')
    if not user.is_active:
        raise exceptions.AuthenticationFailed('user is inactive')
    # self.enforce_csrf(scope)
    return (user)


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
def get_last_10_messages(room):
    # if len(room.messages.all()) > 10:
    return room.messages.all() or None
    # else:
    #     return room.messages.all()

@database_sync_to_async
def save_message(room, text_data_json):
    # message = MessageSerializer(text_data_json)
    content = text_data_json["message"]
    message = Message.objects.create(username="lol", message_type="chat", content=content)
    room.messages.add(message)
    room.save()
