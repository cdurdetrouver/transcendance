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
from .data_handling import add_in_room, remove_from_room, get_user_by_name
from .models import Room
from rest_framework.response import Response
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
    print(rooms)
    if (not rooms.exists()):
        return Response({"error": "room not found"}, status=status.HTTP_404_NOT_FOUND)
    rooms_s = (RoomSerializer(rooms, many=True)).data
    print(rooms_s)
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
        user = get_user_by_name(username)
        return user
    except:
        return None

def add_user(data, room):
    user = find_user(data)
    if not user:
        return Response({"error": "user not found"}, status=status.HTTP_404_NOT_FOUND)
    add_in_room(room, user)
    return 1

def delete_user(data, user, room):
    user = find_user(data)
    if not user:
        return Response({"error": "user not found"}, status=status.HTTP_404_NOT_FOUND)
    return 1

@api_view(['POST', 'DELETE'])
def user(request):
    user = request.user
    data = json.loads(request.body)
    room_name = data['room_name']
    room = Room.objects.filter(name=room_name).all().first()

    if not room:
        return Response({"error": "room not found"}, status=status.HTTP_404_NOT_FOUND)
    if (request.method == 'POST'):
        return add_user(data, user, room)
    elif (request.method == 'DELETE'):
        return delete_user(data, user, room)

@api_view()
def websocket_connect(request):
    # Vérifiez si la requête est bien une connexion WebSocket
    if not request.is_web_socket():
        return HttpResponse(status=400)

    # Récupérez l'access token du payload
    try:
        data = json.loads(request.body)
        access_token = data['accessToken']
    except (KeyError, json.JSONDecodeError):
        return HttpResponse(status=400)