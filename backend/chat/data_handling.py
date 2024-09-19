from .models import Message, Room, User
from django.conf import settings
from channels.db import database_sync_to_async
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .serializers import MessageSerializer
import jwt
from django.utils import timezone

@database_sync_to_async
def get_user(scope):
    access_token = scope['subprotocols'][1]
    print(scope)
    payload = jwt.decode(
			access_token, settings.SECRET_KEY, algorithms=['HS256'])
    user = User.objects.filter(id=payload['user_id']).first()
    if user is None:
        return Response({'error': 'Invalid refresh token'}, status=status.HTTP_400_BAD_REQUEST)
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
    if len(room.messages.all()) > 10:
        return room.messages.all()[len(room.messages.all())-10:len(room.messages.all())]
    else:
        return room.messages.all()

@database_sync_to_async
def save_message(room, text_data_json):
    # message = MessageSerializer(text_data_json)
    content = text_data_json["message"]
    message = Message.objects.create(username="lol", message_type="chat", content=content)
    room.messages.add(message)
    room.save()
