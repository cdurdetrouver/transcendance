from rest_framework import serializers
from .models import Message, Room
from user.serializers import UserSerializer
from drf_yasg import openapi

class MessageSerializer(serializers.ModelSerializer):
	class Meta:
		model = Message
		fields = ['id', 'author_id', 'message_type', 'content', 'send_at']


class RoomSerializer(serializers.ModelSerializer):

	room_swagger=openapi.Schema(
		type=openapi.TYPE_OBJECT,
		properties={
			'id': openapi.Schema(type=openapi.TYPE_INTEGER),
			'name':openapi.Schema(type=openapi.TYPE_STRING),
			'participants_id':openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Schema(type=openapi.TYPE_INTEGER)),
		}
	)

	class Meta:
		model = Room
		fields = ['id', 'name', "participants_id"]