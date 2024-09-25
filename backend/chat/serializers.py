from rest_framework import serializers
from .models import Message
from user.serializers import UserSerializer

class MessageSerializer(serializers.ModelSerializer):
	class Meta:
		model = Message
		fields = ['id', 'author_id', 'message_type', 'content', 'send_at']

