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
    return JsonResponse({'rooms': rooms_s}, status=status.HTTP_200_OK)

def check_admin(user, room):
    if (room.created_by.id == user.id):
        return True
    return False

def create_room(room, user, data):

    if room:
        return JsonResponse({'room_statuts': 'already exists'}, status=status.HTTP_303_SEE_OTHER)
    new_room = Room.objects.create(created_by=user)
    new_room.participants.set([user])
    room_s = RoomSerializer(new_room, data=data, partial=True)
    if room_s.is_valid():
        room_s.save()
        return  JsonResponse({'room_statuts': 'created', 'room_name' : room_s.data['name']}, status=status.HTTP_200_OK)
    new_room.delete()
    error_messages = [str(error) for errors in room_s.errors.values() for error in errors]
    return JsonResponse({'error':error_messages[0]}, status=status.HTTP_400_BAD_REQUEST)

def change_room_info(data, room):

    try:
        new_name = data['new_name']
        if Room.objects.filter(name=new_name).all().first():
            return JsonResponse({'room_statuts': 'room name already in use'}, status=status.HTTP_303_SEE_OTHER)
        room.name = new_name
        room.save()
        return JsonResponse({'room_statuts': 'name changed', 'room_name' : room.name}, status=status.HTTP_200_OK)
    except:
        pass
    try:
        new_photo = data['new_photo']
        return JsonResponse({'room_statuts': 'photo changed'}, status=status.HTTP_200_OK)
    except:
        pass
    return JsonResponse({'error': 'This feature is not implemented yet.'}, status=status.HTTP_501_NOT_IMPLEMENTED)

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
    room_name = request.data.get('room_name')
    room = Room.objects.filter(name=room_name).all().first()

    if (request.method == 'POST'):
        return create_room(room, user, request.data)
    if (not room):
        return Response({"error": "room not found"}, status=status.HTTP_404_NOT_FOUND)
    if (check_admin(user, room) == False):
        return JsonResponse({'error': 'user need to be admin of the room'}, status=status.HTTP_403_FORBIDDEN)
    if (request.method == 'PUT'):
        return change_room_info(request.data, room)

def find_user(data):
    username = data['username']
    try:
        user = get_object_or_404(User, username=username)
        return user
    except:
        return None

def add_user(user, room):
    if room.participants.filter(id=user.id).first():
        return JsonResponse({'User status': 'Already in the {}'.format(room.name)}, status=status.HTTP_303_SEE_OTHER)
    room.participants.add(user)
    room.save()
    return Response({"User status": "Added in {} successfully".format(room.name)}, status=status.HTTP_200_OK)


def delete_user(user, room):
    if not room.participants.filter(id=user.id).first():
        return JsonResponse({'User status': 'Not found in room {}'.format(room.name)},  status=status.HTTP_404_NOT_FOUND)
    room.participants.set(room.participants.exclude(id=user.id))
    room.save()
    print("User status ", "Deleted from {} successfully.".format(room.name))
    return Response({"User status": "Deleted from {} successfully.".format(room.name)}, status=status.HTTP_200_OK)

@api_view(['POST', 'DELETE'])
def user(request):
    user = request.user
    data = json.loads(request.body)
    room_name = data['room_name']
    if (not room_name):
        return Response({"error": "room not found"}, status=status.HTTP_404_NOT_FOUND)
    room = Room.objects.filter(name=room_name).all().first()

    if not room:
        return Response({"error": "room not found"}, status=status.HTTP_404_NOT_FOUND)
    if (check_admin(user, room) == False):
        return JsonResponse({'error': 'user need to be admin of the room'}, status=status.HTTP_403_FORBIDDEN)
    user_add = find_user(data)
    if not user:
        return Response({"error": "user not found"}, status=status.HTTP_404_NOT_FOUND)
    if (request.method == 'POST'):
        return add_user(user_add, room)
    elif (request.method == 'DELETE'):
        return delete_user(user_add, room)

@api_view(['POST'])
def is_admin(request):
    user = request.user
    data = json.loads(request.body)
    room_name = data['room_name']
    if (not room_name):
        return Response({"error": "room not found"}, status=status.HTTP_404_NOT_FOUND)
    room = Room.objects.filter(name=room_name).all().first()

    if not room:
        return Response({"error": "room not found"}, status=status.HTTP_404_NOT_FOUND)
    if (check_admin(user, room) == False):
        return JsonResponse({'error': 'user need to be admin of the room'}, status=status.HTTP_403_FORBIDDEN)
    else:
        return JsonResponse({"User status": "Your are admin of {}".format(room.name)}, status=status.HTTP_200_OK)                                                                                                                                                                                                 