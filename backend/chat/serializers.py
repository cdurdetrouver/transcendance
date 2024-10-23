from rest_framework import serializers
from .models import Message, Room
from user.serializers import UserSerializer
from drf_yasg import openapi

class MessageSerializer(serializers.ModelSerializer):
	author = UserSerializer()

	message_swagger = openapi.Schema(
		type=openapi.TYPE_OBJECT,
		properties={
			'id': openapi.Schema(type=openapi.TYPE_INTEGER),
			'author': UserSerializer.user_swagger,
			'message_type': openapi.Schema(type=openapi.TYPE_STRING),
			'content': openapi.Schema(type=openapi.TYPE_STRING),
			'send_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME)
		},
	)

	class Meta:
		model = Message
		fields = ['id', 'author', 'message_type', 'content', 'send_at']


class RoomSerializer(serializers.ModelSerializer):
	created_by = UserSerializer()
	participants = UserSerializer(many=True)

	room_swagger=openapi.Schema(
		type=openapi.TYPE_OBJECT,
		properties={
			'id': openapi.Schema(type=openapi.TYPE_INTEGER),
			'name': openapi.Schema(type=openapi.TYPE_STRING),
			'created_by' : UserSerializer.user_swagger,
			'participants': openapi.Schema(
	            type=openapi.TYPE_ARRAY,
                items=UserSerializer.user_swagger
			),
			'room_picture': openapi.Schema(type=openapi.TYPE_STRING),
        }
	)

	class Meta:
		model = Room
		fields = ['id', 'name', 'created_by', 'participants', 'room_picture']