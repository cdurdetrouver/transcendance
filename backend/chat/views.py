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
from .data_handling import remove_from_room, get_user_by_name, get_room
from .models import Room, User
from rest_framework.response import Response
from asgiref.sync import async_to_sync
import json
import string
import random
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

def gen_group_name():
    group_name = ''.join(random.choices(
        string.ascii_uppercase + string.ascii_lowercase, k=50))
    if (Room.objects.filter(group_name=group_name).exists()):
        return gen_group_name()
    return group_name

def create_room(room, user, data):

    if room:
        return JsonResponse({'room_statuts': 'already exists'}, status=status.HTTP_303_SEE_OTHER)
    new_room = Room.objects.create(created_by=user, group_name=gen_group_name())
    new_room.participants.set([user])
    room_s = RoomSerializer(new_room, data=data, partial=True)
    if room_s.is_valid():
        room_s.save()
        return  JsonResponse({'room_statuts': 'created', 'room_name' : room_s.data['name']}, status=status.HTTP_200_OK)
    new_room.delete()
    error_messages = [str(error) for errors in room_s.errors.values() for error in errors]
    return JsonResponse({'error':error_messages[0]}, status=status.HTTP_400_BAD_REQUEST)

def update_room(data, room):
    if Room.objects.filter(name=data.get('new_name')).all().first():
            return JsonResponse({'room_statuts': 'room name already in use'}, status=status.HTTP_303_SEE_OTHER)
    room_s = RoomSerializer(room, data=data, partial=True)
    if room_s.is_valid():
        room_s.save()
        return  JsonResponse({'room_statuts': 'updated', 'room_name' : room_s.data['name']}, status=status.HTTP_200_OK)
    error_messages = [str(error) for errors in room_s.errors.values() for error in errors]
    return JsonResponse({'error':error_messages[0]}, status=status.HTTP_400_BAD_REQUEST)

def delete_room(room):
    room.delete()
    return Response({"Room status": "{} deleted successfully.".format(room.name)}, status=status.HTTP_200_OK)

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
def room(request, room_id):
    user = request.user
    if not room_id:
        return Response({"error": "room not found"}, status=status.HTTP_404_NOT_FOUND)
    room = Room.objects.filter(id=room_id).all().first()

    if (request.method == 'POST'):
        return create_room(room, user, request.data)
    if (not room):
        return Response({"error": "room not found"}, status=status.HTTP_404_NOT_FOUND)
    if (check_admin(user, room) == False):
        return JsonResponse({'error': 'user need to be admin of the room'}, status=status.HTTP_403_FORBIDDEN)
    elif (request.method == 'PUT'):
        return update_room(request.data, room)
    elif (request.method == 'DELETE'):
        return delete_room(room)

def find_user(data):
    name = data['username']
    user = User.objects.filter(username=name).all().first()
    return user

def add_user(user_data, room, user):
    if (user in user_data.blocked_users.all()):
        return JsonResponse({'error': 'user blocked you.'}, status=status.HTTP_403_FORBIDDEN)
    if room.participants.filter(id=user_data.id).first():
        return JsonResponse({'User status': 'Already in the {}'.format(room.name)}, status=status.HTTP_303_SEE_OTHER)
    elif user_data.invite_list_id and room.id in user_data.invite_list_id:
        return JsonResponse({'User status': 'Already sent an invitation for {}'.format(room.name)}, status=status.HTTP_303_SEE_OTHER)
    if not user_data.invite_list_id:
        user_data.invite_list_id = [room.id]
    else:
        user_data.invite_list_id.append(room.id)
    user_data.save()
    return Response({"User status": "Added in {} successfully".format(room.name)}, status=status.HTTP_200_OK)


def delete_user(user, room):
    if not room.participants.filter(id=user.id).first():
        return JsonResponse({'User status': 'Not found in room {}'.format(room.name)},  status=status.HTTP_404_NOT_FOUND)
    room.participants.set(room.participants.exclude(id=user.id))
    room.save()
    list_user = room.participants.all()
    if (len(list_user) == 0):
        room.delete()
    return Response({"User status": "Deleted from {} successfully.".format(room.name)}, status=status.HTTP_200_OK)

@api_view(['POST', 'DELETE'])
def user(request):
    user = request.user
    data = json.loads(request.body)
    room_id = data['room_id']
    if (not room_id):
        return Response({"error": "room not found"}, status=status.HTTP_404_NOT_FOUND)
    room = Room.objects.filter(id=room_id).all().first()

    if not room:
        return Response({"error": "room not found"}, status=status.HTTP_404_NOT_FOUND)
    user_data = find_user(data)
    if not user:
        return Response({"error": "user not found"}, status=status.HTTP_404_NOT_FOUND)
    if (user != user_data and check_admin(user, room) == False):
        return JsonResponse({'error': 'user need to be admin of the room'}, status=status.HTTP_403_FORBIDDEN)
    if (request.method == 'POST'):
        return add_user(user_data, room, user)
    elif (request.method == 'DELETE'):
        return delete_user(user_data, room)

@api_view(['POST'])
def is_admin(request):
    user = request.user
    data = json.loads(request.body)
    room_id = data['room_id']
    if (not room_id):
        return Response({"error": "room not found"}, status=status.HTTP_404_NOT_FOUND)
    room = Room.objects.filter(id=room_id).all().first()

    if not room:
        return Response({"error": "room not found"}, status=status.HTTP_404_NOT_FOUND)
    if (check_admin(user, room) == False):
        return JsonResponse({'error': 'user need to be admin of the room'}, status=status.HTTP_403_FORBIDDEN)
    else:
        room_s = RoomSerializer(room)
        return JsonResponse({"User status": "Your are admin of {}".format(room.name), 'room' : room_s.data}, status=status.HTTP_200_OK)

def get_invite(user):
    rooms = []

    if (not user.invite_list_id):
        return JsonResponse({"error": "no invitations"}, status=status.HTTP_404_NOT_FOUND)

    for room_id in user.invite_list_id:
        rooms.append(get_object_or_404(Room, id=room_id))
    rooms_s = RoomSerializer(rooms, many=True)
    return JsonResponse({'invitation': rooms_s.data}, status=status.HTTP_200_OK)

def delete_invite(user, room_id, value):
    if (not user.invite_list_id or room_id not in user.invite_list_id):
        return JsonResponse({"error": "no invitation"}, status=status.HTTP_403_FORBIDDEN)
    user.invite_list_id.remove(room_id)
    user.save()
    room = get_object_or_404(Room, id=room_id)
    if not room:
        return Response({"error": "room not found"}, status=status.HTTP_404_NOT_FOUND)
    if value == "TRUE":
        room.participants.add(user)
        room.save()
        return JsonResponse({'invitation': 'accepted'}, status=status.HTTP_200_OK)
    elif value == "FALSE":
        return JsonResponse({'invitation': 'refused'}, status=status.HTTP_200_OK)
    return JsonResponse({'error': 'wrong format for value.'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST', 'DELETE'])
def invite(request):
    user = request.user

    if (request.method == 'GET'):
        return get_invite(user)
    elif (request.method == 'DELETE'):
        data = json.loads(request.body)
        room_id = data['room_id']
        value = data['value']
        return delete_invite(user, room_id, value)