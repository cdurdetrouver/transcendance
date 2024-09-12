from rest_framework import serializers
from .models import Message

class MessageSerializer(serializers.ModelSerializer):
	class Meta:
		model = Message
		fields = ['id', 'user_id', 'message_type', 'content', 'created_at']

