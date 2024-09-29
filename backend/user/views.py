from django.contrib.auth.hashers import check_password
from django.http import JsonResponse
from django.conf import settings
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .utils import generate_access_token, generate_refresh_token, AttributeDict, get_intra_user, get_github_user, get_google_user
from .models import User
from .serializers import UserSerializer, LoginSerializer
from pong.models import Game
from pong.serializers import GameSerializer
import jwt
import datetime

@swagger_auto_schema(
	method='get',
	request_body=None,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'user': UserSerializer.user_swagger
			}
		),
		403: "Forbidden"
	},
	operation_description="Retrieve a list of users"
)
@swagger_auto_schema(
	method='put',
	request_body=UserSerializer,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'user': UserSerializer.user_swagger
			}
		),
		400: 'User not valid'
	},
	operation_description="Update a user"
)
@swagger_auto_schema(
	method='delete',
	request_body=None,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'message': openapi.Schema(type=openapi.TYPE_STRING, description='User deleted')
			}
		)
	},
	operation_description="Delete a user"
)
@api_view(['GET', 'PUT', 'DELETE'])
def user_detail(request):
	user = request.user
	if request.method == 'PUT':
		username = request.data.get('username')
		profile_picture = request.FILES.get('profilePicture')

		data = {}
		if profile_picture is not None:
			data['profile_picture'] = profile_picture

		if username is not None:
			data['username'] = username

		serializer = UserSerializer(user, data=data, partial=True)
		print(serializer)
		if serializer.is_valid():
			if profile_picture is not None and user.picture_remote is not None:
				serializer.validated_data['picture_remote'] = None
			if profile_picture is not None:
				id = user.id
				profile_picture.name = f'{id}.png'
			serializer.save()
			return JsonResponse({'user': serializer.data}, status=status.HTTP_200_OK)
		error_messages = [str(error) for errors in serializer.errors.values() for error in errors]
		return JsonResponse({'error':error_messages[0]}, status=status.HTTP_400_BAD_REQUEST)
	elif request.method == 'DELETE':
		user.delete()
		return JsonResponse({'message': 'User deleted'}, status=status.HTTP_200_OK)
	else :
		serialized_user = UserSerializer(user)
		return JsonResponse({'user': serialized_user.data}, status=status.HTTP_200_OK)

@swagger_auto_schema(
	method='get',
	request_body=None,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'user': UserSerializer.user_swagger
			}
		),
		403: "Forbidden",
		404: "User doesn't exist"
	},
	operation_description="Retrieve a list of users"
)
@api_view(['GET'])
def user_id(request, user_id):

	user = User.objects.filter(id=user_id).first()
	if user is None:
		return Response({"error": "User doesn't exist"}, status=status.HTTP_404_NOT_FOUND)
	serialized_user = UserSerializer(user)
	return JsonResponse({'user': serialized_user.data}, status=status.HTTP_200_OK)

@swagger_auto_schema(
	method='post',
	request_body=LoginSerializer,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'user': UserSerializer.user_swagger
			}
		),
		404: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'error': openapi.Schema(type=openapi.TYPE_STRING, description="User doesn't exist")
			}
		),
		400: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'error': openapi.Schema(type=openapi.TYPE_STRING, description="Invalid credentials or validation error")
			}
		)
	},
	operation_description="Authenticate a user and return an access token and user data",
)
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
	serializer = LoginSerializer(data=request.data)

	if serializer.is_valid():
		if serializer.validated_data['user_type'] == 'intra':
			# Connexion par intra
			code = serializer.validated_data['code']
			user = get_intra_user(code)
			if user is None:
				return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
			elif user.user_type != 'intra':
				return Response({"error": "User is not an intra user"}, status=status.HTTP_400_BAD_REQUEST)
			user_serializer = UserSerializer(user)
		elif serializer.validated_data['user_type'] == 'github':
			# Connexion par github
			code = serializer.validated_data['code']
			user = get_github_user(code)
			if user is None:
				return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
			elif user.user_type != 'github':
				return Response({"error": "User is not a github user"}, status=status.HTTP_400_BAD_REQUEST)
			user_serializer = UserSerializer(user)
		elif serializer.validated_data['user_type'] == 'google':
			# Connexion par google
			code = serializer.validated_data['code']
			user = get_google_user(code)
			if user is None:
				return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
			elif user.user_type != 'google':
				return Response({"error": "User is not a google user"}, status=status.HTTP_400_BAD_REQUEST)
			user_serializer = UserSerializer(user)
		elif serializer.validated_data['user_type'] == 'email':
			# Connexion par email et mot de passe
			email = serializer.validated_data['email']
			password = serializer.validated_data['password']

			if email is None or password is None:
				return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)
			user = User.objects.filter(email=email, user_type='email').first()
			if user is None:
				return Response({"error": "User doesn't exist"}, status=status.HTTP_404_NOT_FOUND)

			if check_password(password, user.password):
				user_serializer = UserSerializer(user)
			else:
				return Response({"error": "Invalid password"}, status=status.HTTP_400_BAD_REQUEST)

		# Generate response
		response = JsonResponse({'user': user_serializer.data}, status=status.HTTP_200_OK)
		refresh_token = generate_refresh_token(user)
		expires = datetime.datetime.utcnow() + datetime.timedelta(days=7)
		secure_cookie = not settings.DEBUG
		response.set_cookie('refresh_token', refresh_token, httponly=True, secure=secure_cookie, samesite='Strict', expires=expires)
		access_token = generate_access_token(user)
		expires = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
		secure_cookie = not settings.DEBUG
		response.set_cookie('access_token', access_token, httponly=True, secure=secure_cookie, samesite='Strict', expires=expires)
		return response
	else:
		error_messages = [str(error) for errors in serializer.errors.values() for error in errors]
		return Response({"error": error_messages[0]}, status=status.HTTP_400_BAD_REQUEST)

@swagger_auto_schema(
	method='post',
	request_body=UserSerializer,
	responses={
		201: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'user': UserSerializer.user_swagger
			}
		),
		400: 'User not valid'
	},
	operation_description="Register a user"
)
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
	user_data = request.data.copy()

	serializer = UserSerializer(data=user_data)

	if serializer.is_valid():
		id = User.objects.all().count() + 1
		serializer.validated_data['profile_picture'].name = f'{id}.png'
		serializer.save()
		user = AttributeDict(serializer.data)
		response = JsonResponse({'user': serializer.data}, status=status.HTTP_201_CREATED)
		refresh_token = generate_refresh_token(user)
		expires = datetime.datetime.utcnow() + datetime.timedelta(days=7)
		secure_cookie = not settings.DEBUG
		response.set_cookie('refresh_token', refresh_token, httponly=True, secure=secure_cookie, samesite='Strict', expires=expires)
		access_token = generate_access_token(user)
		expires = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
		secure_cookie = not settings.DEBUG
		response.set_cookie('access_token', access_token, httponly=True, secure=secure_cookie, samesite='Strict', expires=expires)
		return response
	else:
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@swagger_auto_schema(
	method='post',
	request_body=None,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'message': openapi.Schema(type=openapi.TYPE_STRING, description='Access token refreshed')
			}
		),
		400: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'error': openapi.Schema(type=openapi.TYPE_STRING, description='Error message')
			}
		)
	},
	operation_description="Retrieve a new access token using a refresh token"
)
@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
	refresh_token = request.COOKIES.get('refresh_token')

	if not refresh_token:
		return Response({'error': 'Refresh token is required'}, status=status.HTTP_400_BAD_REQUEST)

	payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=['HS256'])
	user = User.objects.filter(id=payload['user_id']).first()

	if user is None:
		return Response({'error': 'Invalid refresh token'}, status=status.HTTP_400_BAD_REQUEST)

	response = JsonResponse({'message': 'Access token refreshed'}, status=status.HTTP_200_OK)
	access_token = generate_access_token(user)
	expires = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
	secure_cookie = not settings.DEBUG
	response.set_cookie('access_token', access_token, httponly=True, secure=secure_cookie, samesite='Strict', expires=expires)
	return response

@swagger_auto_schema(
	method='post',
	request_body=None,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'message': openapi.Schema(type=openapi.TYPE_STRING, description='Logged out successfully'),
			}
		)
	},
	operation_description="Log out a user"
)
@api_view(['POST'])
@permission_classes([AllowAny])
def logout(request):
	response = JsonResponse({'message': 'Logged out successfully'})
	response.delete_cookie('refresh_token')
	response.delete_cookie('access_token')
	return response

@swagger_auto_schema(
	method='get',
	request_body=None,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'games': openapi.Schema(
					type=openapi.TYPE_ARRAY,
					items=GameSerializer.game_swagger
				)
			}
		),
		404: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'error': openapi.Schema(type=openapi.TYPE_STRING, description="User doesn't exist")
			}
		)
	},
	operation_description="Retrieve a list of games for a user"
)
@api_view(['GET'])
def user_games(request, user_id):
	user = User.objects.filter(id=user_id).first()
	if user is None:
		return Response({"error": "User doesn't exist"}, status=status.HTTP_404_NOT_FOUND)
	games = Game.objects.filter(player1=user)
	games_s = GameSerializer(games, many=True).data
	games = Game.objects.filter(player2=user)
	games_s += GameSerializer(games, many=True).data
	return JsonResponse({'games': games_s}, status=status.HTTP_200_OK)
