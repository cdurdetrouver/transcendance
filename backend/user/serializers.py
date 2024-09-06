from rest_framework import serializers
from .models import User
from drf_yasg import openapi

class UserSerializer(serializers.ModelSerializer):
	password = serializers.CharField(write_only=True)

	user_swagger=openapi.Schema(
		type=openapi.TYPE_OBJECT,
		properties={
			'username': openapi.Schema(type=openapi.TYPE_STRING),
			'email': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_EMAIL),
			'user_type': openapi.Schema(type=openapi.TYPE_STRING),
			'created_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
			'updated_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
		}
	)

	class Meta:
		model = User
		fields = '__all__'

class LoginSerializer(serializers.ModelSerializer):
	password = serializers.CharField(write_only=True)

	class Meta:
		model = User
		fields = ['email', 'password', 'user_type']
