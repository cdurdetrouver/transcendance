from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from twisted.application.runner.test.test_pidfile import ifPlatformSupported
from autobahn.wamp import request
from django.http import JsonResponse
from .serializers import RoomSerializer
from user.serializers import UserSerializer
from django.shortcuts import get_object_or_404
from .data_handling import remove_from_room, get_user_by_name
from .models import Room, User
from rest_framework.response import Response
from asgiref.sync import async_to_sync
import json
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

@swagger_auto_schema(
	method='get',
	request_body=None,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'rooms': openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=RoomSerializer.room_swagger
				)
			}
		)
	},
	operation_description="Retrieve a list of chat for user"
)
@api_view(['GET'])
def get_user_chats(request):
    user = request.user
    rooms = Room.objects.filter(participants=user)
    if (not rooms.exists()):
        return Response({"error": "room not found"}, status=status.HTTP_404_NOT_FOUND)
    rooms_s = (RoomSerializer(rooms, many=True)).data
    response = JsonResponse({'rooms': rooms_s}, status=status.HTTP_200_OK)
    return response

def create_room(data, user):
    room_name = data['room_name']
    room = Room.objects.filter(name=room_name).all()
    if room:
        response = JsonResponse({'room_statuts': 'already exists'}, status=status.HTTP_303_SEE_OTHER)
        return response
    room = Room.objects.create(created_by=user, name=room_name)
    room.participants.set([user])
    room.save()
    response = JsonResponse({'room_statuts': 'created', 'room_name' : room_name}, status=status.HTTP_200_OK)
    return response

@swagger_auto_schema(
	method='post',
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'room_name': openapi.Schema(
                type=openapi.TYPE_STRING,
                description='The name of the room')
        },
        required=['room_name']
    ),
    responses={
        200: openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'room_statuts': openapi.Schema(
                    type=openapi.TYPE_STRING, 
                    description='Status of room creation'),
            }
        ),
        303: openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'room_statuts': openapi.Schema(
                    type=openapi.TYPE_STRING, 
                    description='Status indicating room already exists'),
            }
        ),
    },
	operation_description="Create a room"
)
@api_view(['POST', 'PUT', 'DELETE', 'GET'])
def room(request):
    user = request.user
    data = json.loads(request.body)

    if (request.method == 'POST'):
        return create_room(data, user)

def find_user(data):
    username = data['username']
    try:
        user = get_object_or_404(User, username=username)
        return user
    except:
        return None

def add_user(user, room):
    print(user.id)
    room.participants.add(user)
    room.save()
    return Response({"User status": "Added in {} successfully".format(room.name)}, status=status.HTTP_200_OK)


def delete_user(user, room):
    async_to_sync(remove_from_room(user, room))
    return Response({"User status": "Deleted from {} successfully.".format(room.name)}, status=status.HTTP_204_NO_CONTENT)

@api_view(['POST', 'DELETE'])
def user(request):
    user = request.user
    data = json.loads(request.body)
    room_name = data['room_name']
    room = Room.objects.filter(name=room_name).all().first()

    print("user: ", user)
    if not room:
        return Response({"error": "room not found"}, status=status.HTTP_404_NOT_FOUND)
    user_add = find_user(data)
    if not user:
        return Response({"error": "user not found"}, status=status.HTTP_404_NOT_FOUND)
    if (request.method == 'POST'):
        print("user post : ", user.id)
        return add_user(user_add, room)
    elif (request.method == 'DELETE'):
        return delete_user(user_add, room)                                                                                                                                                                                                   