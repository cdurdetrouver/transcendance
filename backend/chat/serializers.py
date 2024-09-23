from rest_framework import serializers
from .models import Message

class MessageSerializer(serializers.ModelSerializer):
	class Meta:
		model = Message
		fields = ['id', 'author', 'message_type', 'content', 'send_at']

