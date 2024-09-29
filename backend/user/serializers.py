from rest_framework import serializers
from .models import User
from drf_yasg import openapi

class UserSerializer(serializers.ModelSerializer):
	password = serializers.CharField(write_only=True)

	user_swagger=openapi.Schema(
		type=openapi.TYPE_OBJECT,
		properties={
			'id': openapi.Schema(type=openapi.TYPE_INTEGER),
			'username': openapi.Schema(type=openapi.TYPE_STRING),
			'email': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_EMAIL),
			'user_type': openapi.Schema(type=openapi.TYPE_STRING),
			'created_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
			'updated_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
		}
	)

	class Meta:
		model = User
		fields = ['id', 'username', 'password', 'email', 'user_type', 'created_at', 'updated_at']

class LoginSerializer(serializers.ModelSerializer):
	email = serializers.EmailField(required=False)
	password = serializers.CharField(write_only=True, required=False)
	code = serializers.CharField(required=False)

	class Meta:
		model = User
		fields = ['email', 'password', 'code', 'user_type']
