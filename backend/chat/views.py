from django.http import HttpResponse, QueryDict, JsonResponse
from rest_framework.decorators import api_view
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from twisted.application.runner.test.test_pidfile import ifPlatformSupported
from autobahn.wamp import request
from .serializers import RoomSerializer
from user.serializers import UserSerializer
from django.shortcuts import get_object_or_404
from .data_handling import remove_from_room, get_user_by_name, get_room
from .models import Room, User
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
		),
        404: 'no room found',
	},
	operation_description="Retrieve a list of chat for user"
)
@api_view(['GET'])
def get_user_chats(request):
    user = request.user
    rooms = Room.objects.filter(participants=user)
    if (not rooms.exists()):
        return JsonResponse({"error": "no room found"}, status=status.HTTP_404_NOT_FOUND)
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

def get_user_mp(id2):
    user_2 = User.objects.filter(id=id2).first()
    if not user_2:
        print(user_2)
        return None, False
    return user_2, True

def mp_exists(user_1, user_2):
    if (user_1.username > user_2.username):
        room_name = user_1.username + '-' + user_2.username
    else:
        room_name = user_2.username + '-' + user_1.username
    room = Room.objects.filter(name=room_name).first()
    if room:
        return None, True
    return room_name, False

def create_room(room, user, data):
    if room:
        return JsonResponse({'error': 'already exists'}, status=status.HTTP_303_SEE_OTHER)
    if 'type' in data:
        if data['type'] == "mp" and isinstance(data["recepient_id"], int) == True:
            recepient, succes = get_user_mp(data["recepient_id"])
            if not succes:
                return JsonResponse({"error": "user not found"}, status=status.HTTP_404_NOT_FOUND)
            if user in recepient.blocked_users.all():
                return JsonResponse({'error': 'user blocked you.'}, status=status.HTTP_403_FORBIDDEN)
            room_name, exists = mp_exists(user, recepient)
            if exists:
                return JsonResponse({'error': 'already exists'}, status=status.HTTP_303_SEE_OTHER)
            new_room = Room.objects.create(name=room_name, group_name=gen_group_name())
            new_room.participants.set([user])
            new_room.created_by = user
            new_room.save()
            room_s = RoomSerializer(new_room)
            if not recepient.invite_list_id:
                recepient.invite_list_id = [new_room.id]
            else:
                recepient.invite_list_id.append(new_room.id)
            recepient.save()
            return  JsonResponse({'room_statuts': 'created', 'room': room_s.data}, status=status.HTTP_200_OK)
    elif isinstance(data, QueryDict):
        new_room = Room.objects.create(created_by=user, group_name=gen_group_name())
        new_room.participants.set([user])
        room_s = RoomSerializer(new_room, data=data, partial=True)
        if room_s.is_valid():
            room_s.save()
            return  JsonResponse({'room_statuts': 'created', 'room' : room_s.data}, status=status.HTTP_200_OK)
        new_room.delete()
        error_messages = [str(error) for errors in room_s.errors.values() for error in errors]
        return JsonResponse({'error':error_messages[0]}, status=status.HTTP_400_BAD_REQUEST)
    return JsonResponse({'error': "request no correctly format"}, status=status.HTTP_400_BAD_REQUEST)

def update_room(data, room):
    room_s = RoomSerializer(room, data=data, partial=True)
    if room_s.is_valid():
        room_s.save()
        return  JsonResponse({'room_statuts': 'updated', 'room' : room_s.data}, status=status.HTTP_200_OK)
    error_messages = [str(error) for errors in room_s.errors.values() for error in errors]
    return JsonResponse({'error':error_messages[0]}, status=status.HTTP_400_BAD_REQUEST)

def delete_room(room):
    room.delete()
    room.save()
    return JsonResponse({"room_statuts": "deleted successfully"}, status=status.HTTP_200_OK)

def info_room(room):
    room_s = RoomSerializer(room)
    return JsonResponse({'room' : room_s.data}, status=status.HTTP_200_OK)

@swagger_auto_schema(
	method='post',
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'type': openapi.Schema(type=openapi.TYPE_STRING, description="mp"),
            'recepient_id': openapi.Schema(
                    type=openapi.TYPE_INTEGER, 
                    description='Id of target user to create an mp'),
            'room': RoomSerializer.room_swagger
        },
        description="This method takes  ( room ) or  ( type and recepient_id )"
    ),
    responses={
        200: openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'room_statuts': openapi.Schema(type=openapi.TYPE_STRING, description='created'),
            }
        ),
        303: 'already exists',
        400: "request no correctly format",
        400: "room serializer errors",
        403: 'user blocked you.',
        404: "user not found",

    },
	operation_description="Create a room"
)
@swagger_auto_schema(
	method='put',
	request_body=RoomSerializer,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
                'room_status': openapi.Schema(type=openapi.TYPE_STRING, description='updated'),
				'room': RoomSerializer.room_swagger
			}
		),
        400: "room serializer errors",
        400: "request no correctly format",
        403: "user need to be admin of the room",
        404: 'no room found',
	},
	operation_description="Update a room"
)
@swagger_auto_schema(
	method='delete',
	request_body= None,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
                'room_status': openapi.Schema(type=openapi.TYPE_STRING, description='deleted successfully'),
			}
		),
        400: "request no correctly format",
        403: "user need to be admin of the room",
        404: 'no room found',
	},
	operation_description="Delete a room"
)
@swagger_auto_schema(
	method='get',
	request_body=None,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
                'room': RoomSerializer.room_swagger,
			}
		),
        400: "request no correctly format",
        404: 'no room found',
	},
	operation_description="Get the data from a room"
)
@api_view(['POST', 'PUT', 'DELETE', 'GET'])
def room(request, room_id):
    user = request.user
    if not room_id:
        return JsonResponse({'error': "request no correctly format"}, status=status.HTTP_400_BAD_REQUEST)
    room = Room.objects.filter(id=room_id).all().first()

    if (request.method == 'POST'):
        return create_room(room, user, request.data)
    if (not room):
        return JsonResponse({"error": "room not found"}, status=status.HTTP_404_NOT_FOUND)
    if (request.method == 'GET'):
        return info_room(room)
    if (check_admin(user, room) == False):
        return JsonResponse({'error': 'user need to be admin of the room'}, status=status.HTTP_403_FORBIDDEN)
    elif (request.method == 'PUT'):
        return update_room(request.data, room)
    elif (request.method == 'DELETE'):
        return delete_room(room)

def find_user(data):
    if  not 'room_id' in data:
        return None
    name = data['username']
    user = User.objects.filter(username=name).all().first()
    return user

def add_user(user_data, room, user):
    if (user in user_data.blocked_users.all()):
        return JsonResponse({'error': 'user blocked you.'}, status=status.HTTP_403_FORBIDDEN)
    if room.participants.filter(id=user_data.id).first():
        return JsonResponse({'error': 'Already in the {}'.format(room.name)}, status=status.HTTP_303_SEE_OTHER)
    elif user_data.invite_list_id and room.id in user_data.invite_list_id:
        return JsonResponse({'error': 'Already sent an invitation for {}'.format(room.name)}, status=status.HTTP_303_SEE_OTHER)
    if not user_data.invite_list_id:
        user_data.invite_list_id = [room.id]
    else:
        user_data.invite_list_id.append(room.id)
    user_data.save()
    return JsonResponse({"User status": "Added in {} successfully".format(room.name)}, status=status.HTTP_200_OK)


def delete_user(user, room):
    if not room.participants.filter(id=user.id).first():
        return JsonResponse({'error': 'Not found in room {}'.format(room.name)},  status=status.HTTP_404_NOT_FOUND)
    room.participants.set(room.participants.exclude(id=user.id))
    room.save()
    list_user = room.participants.all()
    if (len(list_user) == 0):
        room.delete()
    return JsonResponse({"User status": "Deleted from {} successfully.".format(room.name)}, status=status.HTTP_200_OK)

@swagger_auto_schema(
	method='delete',
    request_body = openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'room_id': openapi.Schema(type=openapi.TYPE_STRING, description='Id of the room'),
        }
    ),
    responses={
		200: "Deleted in room_name successfully",
        400: 'request no correctly format',
        404: "room not found",
        404: "user not found",
        403: 'user need to be admin of the room',
        403: 'user blocked you.',
        303: 'Already in the room_name',
        303: 'Already sent an invitation for user_name',
	},
	operation_description="Delete a new user in room"
)
@swagger_auto_schema(
	method='post',
    request_body = openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'room_id': openapi.Schema(type=openapi.TYPE_STRING, description='Id of the room'),
        }
    ),
    responses={
		200: "Added in room_name successfully",
        400: 'request no correctly format',
        404: "room not found",
        404: "user not found",
        403: 'user need to be admin of the room',
        403: 'user blocked you.',
        303: 'Already in the room_name',
        303: 'Already sent an invitation for user_name',
	},
	operation_description="Post a new user in room"
)
@api_view(['POST', 'DELETE'])
def user(request):
    user = request.user
    data = json.loads(request.body)
    if  not 'room_id' in data:
        return JsonResponse({'error': "request no correctly format"}, status=status.HTTP_400_BAD_REQUEST)
    room_id = data['room_id']
    room = Room.objects.filter(id=room_id).all().first()

    if not room:
        return JsonResponse({"error": "room not found"}, status=status.HTTP_404_NOT_FOUND)
    user_data = find_user(data)
    if not user_data:
        return JsonResponse({"error": "user not found"}, status=status.HTTP_404_NOT_FOUND)
    if (user != user_data and check_admin(user, room) == False):
        return JsonResponse({'error': 'user need to be admin of the room'}, status=status.HTTP_403_FORBIDDEN)
    if (request.method == 'POST'):
        return add_user(user_data, room, user)
    elif (request.method == 'DELETE'):
        return delete_user(user_data, room)

@swagger_auto_schema(
	method='get',
	request_body=None,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
                "User status": openapi.Schema(type=openapi.TYPE_STRING, description="Your are admin of room_name"),
				'room': RoomSerializer.room_swagger
			}
		),
        400: 'request no correctly format',
        403: "user isn't admin of the room",
        404: 'no room found',
	},
	operation_description="IS admin ?"
)
@api_view(['GET'])
def is_admin(request, room_id):
    user = request.user
    if not room_id:
        return JsonResponse({'error': "request no correctly format"}, status=status.HTTP_400_BAD_REQUEST)
    room = Room.objects.filter(id=room_id).all().first()

    if not room:
        return JsonResponse({"error": "room not found"}, status=status.HTTP_404_NOT_FOUND)
    if (check_admin(user, room) == False):
        return JsonResponse({'error': "user isn't admin of the room"}, status=status.HTTP_403_FORBIDDEN)
    else:
        room_s = RoomSerializer(room)
        return JsonResponse({"User status": "Your are admin of {}".format(room.name), 'room' : room_s.data}, status=status.HTTP_200_OK)

def get_invite(user):
    rooms = []

    if not user.invite_list_id or not len(user.invite_list_id):
        return JsonResponse({"error": "no invitations"}, status=status.HTTP_404_NOT_FOUND)

    for room_id in user.invite_list_id:
        room = Room.objects.filter(id=room_id).all().first()
        if not room:
            user.invite_list_id.remove(room_id)
        else:
            rooms.append(room)
    user.save()
    if len(rooms) > 0:
        rooms_s = RoomSerializer(rooms, many=True)
        return JsonResponse({'invitation': rooms_s.data}, status=status.HTTP_200_OK)
    return JsonResponse({"error": "no invitations"}, status=status.HTTP_404_NOT_FOUND)

def delete_invite(user, room_id, value):
    if (not user.invite_list_id or room_id not in user.invite_list_id):
        return JsonResponse({"error": "no invitation"}, status=status.HTTP_403_FORBIDDEN)
    room = Room.objects.filter(id=room_id).all().first()
    if not room:
        return JsonResponse({"error": "room not found"}, status=status.HTTP_404_NOT_FOUND)
    user.invite_list_id.remove(room_id)
    user.save()
    if value == "TRUE":
        room.participants.add(user)
        room.save()
        return JsonResponse({'invitation': 'accepted'}, status=status.HTTP_200_OK)
    elif value == "FALSE":
        return JsonResponse({'invitation': 'refused'}, status=status.HTTP_200_OK)
    return JsonResponse({'error': 'wrong format for value.'}, status=status.HTTP_400_BAD_REQUEST)

@swagger_auto_schema(
	method='get',
	request_body=None,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'invitation': openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=RoomSerializer.room_swagger
				)
			}
		),
        400: 'request no correctly format',
        400: 'wrong format for value.',
        404: "no invitations",
	},
	operation_description="Retrieve a list of invite of user"
)
@swagger_auto_schema(
	method='delete',
	request_body=openapi.Schema(
		type=openapi.TYPE_OBJECT,
		properties={
			'room_id': openapi.Schema(type=openapi.TYPE_STRING, description='room_id of the selected room'),
			'value': openapi.Schema(type=openapi.TYPE_STRING, description='TRUE or FALSE'),
		},
		required=['room_id', 'value']
	),
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'invitation': openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=RoomSerializer.room_swagger
				)
			}
		),
        400 :'request no correctly format',
        403: "no invitations",
        404: "no invitation",
	},
	operation_description="Accept or decline an invite of user for a room"
)
@api_view(['GET', 'DELETE'])
def invite(request):
    user = request.user

    if (request.method == 'GET'):
        return get_invite(user)
    elif (request.method == 'DELETE'):
        data = json.loads(request.body)
        if not 'room_id' in data or not 'value' in data:
            return JsonResponse({'error': "request no correctly format"}, status=status.HTTP_400_BAD_REQUEST)
        room_id = data['room_id']
        value = data['value']
        return delete_invite(user, room_id, value)
