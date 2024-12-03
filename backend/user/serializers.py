from rest_framework import serializers
from .models import User
from drf_yasg import openapi

class UserSerializer(serializers.ModelSerializer):
	password = serializers.CharField(write_only=True)

	user_schema = openapi.Schema(
		type=openapi.TYPE_OBJECT,
		properties={
			'id': openapi.Schema(type=openapi.TYPE_INTEGER),
			'username': openapi.Schema(type=openapi.TYPE_STRING),
			'email': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_EMAIL),
			'profile_picture': openapi.Schema(type=openapi.TYPE_STRING),
			'picture_remote': openapi.Schema(type=openapi.TYPE_STRING),
			'user_type': openapi.Schema(type=openapi.TYPE_STRING),
			'wins': openapi.Schema(type=openapi.TYPE_INTEGER),
			'looses': openapi.Schema(type=openapi.TYPE_INTEGER),
			'best_score': openapi.Schema(type=openapi.TYPE_INTEGER),
			'created_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
			'updated_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
			'last_login': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
		}
	)

	user_swagger=openapi.Schema(
		type=openapi.TYPE_OBJECT,
		properties={
			'id': openapi.Schema(type=openapi.TYPE_INTEGER),
			'username': openapi.Schema(type=openapi.TYPE_STRING),
			'email': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_EMAIL),
			'profile_picture': openapi.Schema(type=openapi.TYPE_STRING),
			'picture_remote': openapi.Schema(type=openapi.TYPE_STRING),
			'user_type': openapi.Schema(type=openapi.TYPE_STRING),
			'wins': openapi.Schema(type=openapi.TYPE_INTEGER),
			'looses': openapi.Schema(type=openapi.TYPE_INTEGER),
			'blocked_users' : openapi.Schema(
				type=openapi.TYPE_ARRAY,
				items=user_schema
			),
			'friends':openapi.Schema(
				type=openapi.TYPE_ARRAY,
				items=user_schema
			),
			'created_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
			'updated_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
			'last_login': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
		}
	)

	class Meta:
		model = User
		fields = ['id', 'username', 'profile_picture','picture_remote', 'password', 'email', 'user_type','wins', 'looses', 'best_score', 'created_at', 'updated_at', 'last_login']

class LoginSerializer(serializers.ModelSerializer):
	email = serializers.EmailField(required=False)
	password = serializers.CharField(write_only=True, required=False)
	code = serializers.CharField(required=False)

	class Meta:
		model = User
		fields = ['email', 'password', 'code', 'user_type']
