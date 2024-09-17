from django.contrib.auth.hashers import check_password, make_password
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from django.conf import settings
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .utils import generate_access_token, generate_refresh_token, AttributeDict
from .models import User
from .serializers import UserSerializer, LoginSerializer
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
@api_view(['GET'])
def user_detail(request):

	user = request.user
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
		400: "Invalid credentials or validation error",
		404: "User doesn't exist",
	},
	operation_description="Authenticate a user and return an access token and user data",
)
@ensure_csrf_cookie
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
	serializer = LoginSerializer(data=request.data)

	if serializer.is_valid():
		email = serializer.validated_data['email']
		password = serializer.validated_data['password']
		try:
			user = User.objects.filter(email=email).first()
		except User.DoesNotExist:
			return Response({"error": "User doesn't exist"}, status=status.HTTP_404_NOT_FOUND)

		if check_password(password, user.password):
			user_serializer = UserSerializer(user)
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
			return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)
	else:
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
@ensure_csrf_cookie
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
	user_data = request.data.copy()
	password = user_data.get('password')

	if not password:
		return Response({'error': 'Password is required'}, status=status.HTTP_400_BAD_REQUEST)

	serializer = UserSerializer(data=user_data)

	if serializer.is_valid():
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
@ensure_csrf_cookie
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
				'message': openapi.Schema(type=openapi.TYPE_STRING, description='Logged out successfully'),
			}
		)
	},
	operation_description="Return leaderboard"
)
@ensure_csrf_cookie
@api_view(['GET'])
def get_leaderboard(request):
	users = User.objects.all().order_by(User.best_score)
	serialized_users = UserSerializer(users)
	response = JsonResponse({"leaderboard": serialized_users.data}, status=status.HTTP_200_OK)
	return response


@swagger_auto_schema(
	method='put',
	request_body=None,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'message': openapi.Schema(type=openapi.TYPE_STRING, description='Logged out successfully'),
			}
		)
	},
	operation_description="Return leaderboard"
)
@ensure_csrf_cookie
@api_view(['PUT'])
def put_score(request):
	user = request.user
	best_score  = request.data.get('best_score')
	if best_score > user.best_score:
		user.best_score = best_score
		user.save()
		response = JsonResponse({"message": "User updated"}, status=status.HTTP_200_OK)
		return response
	else:
		response = JsonResponse({"message": "no update"}, status=status.HTTP_200_OK)
