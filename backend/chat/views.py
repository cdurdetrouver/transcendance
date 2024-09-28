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
from .data_handling import room_exists
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
    rooms = Room.objects.filter(participants_id__contains=[user.id])
    print(rooms)
    if (not rooms.exists()):
        return Response({"error": "not room found"}, status=status.HTTP_404_NOT_FOUND)
    rooms_s = (RoomSerializer(rooms, many=True)).data
    print(rooms_s)
    response = JsonResponse({'rooms': rooms_s}, status=status.HTTP_200_OK)
    return response

@swagger_auto_schema(
	method='post',
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'room_name': openapi.Schema(
                type=openapi.TYPE_STRING,
                description='The name of the room'),
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
@api_view(['POST'])
def create_room(request):
    user = request.user
    data = json.loads(request.body)
    room_name = data['room_name']

    room = Room.objects.filter(name=room_name).all()
    if room:
        response = JsonResponse({'room_statuts': 'already exists'}, status=status.HTTP_303_SEE_OTHER)
        return response
    room = Room.objects.create(name=room_name, participants_id=[user.id])
    room.save()
    response = JsonResponse({'room_statuts': 'created'}, status=status.HTTP_200_OK)
    return response

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