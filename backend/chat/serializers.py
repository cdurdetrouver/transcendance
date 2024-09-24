from rest_framework import serializers
from .models import Message
from user.serializers import UserSerializer

class MessageSerializer(serializers.ModelSerializer):
	author = UserSerializer()
	class Meta:
		model = Message
		fields = ['id', 'author', 'message_type', 'content', 'send_at']

