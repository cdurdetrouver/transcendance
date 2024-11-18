from django.contrib.auth.hashers import check_password, make_password
from django.http import JsonResponse
from django.conf import settings
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .utils import generate_access_token, generate_refresh_token, get_intra_user, get_github_user, get_google_user, is_valid_username, is_valid_password
from .models import User
from .serializers import UserSerializer, LoginSerializer
from pong.models import Game
from pong.serializers import GameSerializer
import jwt
import datetime
import pyotp
import qrcode
from io import BytesIO
import base64

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
		),
		400: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'error': openapi.Schema(type=openapi.TYPE_STRING, description='username error')
			}
		),
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

		if username is not None and username != user.username:
			succes, error = is_valid_username(username)
			if not succes:
				return JsonResponse({'error': error}, status=status.HTTP_400_BAD_REQUEST)
			data['username'] = username

		serializer = UserSerializer(user, data=data, partial=True)
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
		response = JsonResponse({'message': 'User deleted'}, status=status.HTTP_200_OK)
		response.delete_cookie('refresh_token')
		response.delete_cookie('access_token')
		return response
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
	if user.blocked_users.filter(id=request.user.id).exists():
		return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
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
		),200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'message': openapi.Schema(type=openapi.TYPE_STRING, description='2FA required'),
				'two_factor_enabled': openapi.Schema(type=openapi.TYPE_BOOLEAN),
				'user_id': openapi.Schema(type=openapi.TYPE_INTEGER)
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
		user_type = serializer.validated_data['user_type']
		user = None

		if user_type == 'intra':
			# Connexion par intra
			code = serializer.validated_data['code']
			user = get_intra_user(code)
		elif user_type == 'github':
			# Connexion par github
			code = serializer.validated_data['code']
			user = get_github_user(code)
		elif user_type == 'google':
			# Connexion par google
			code = serializer.validated_data['code']
			user = get_google_user(code)
		elif user_type == 'email':
			# Connexion par email et mot de passe
			email = serializer.validated_data['email']
			password = serializer.validated_data['password']

			user = User.objects.filter(email=email, user_type='email').first()
			if user and not check_password(password, user.password):
				return Response({"error": "Invalid password"}, status=status.HTTP_400_BAD_REQUEST)
		else:
			return Response({"error": "User type not supported"}, status=status.HTTP_400_BAD_REQUEST)

		if user is None:
			return Response({"error": "User doesn't exist"}, status=status.HTTP_404_NOT_FOUND)
		if user.user_type != user_type:
			return Response({"error": "User type doesn't match"}, status=status.HTTP_400_BAD_REQUEST)

		# 2FA
		if user.is_two_factor_enabled:
			return Response({
				'message': '2FA required',
				'two_factor_enabled': True,
				'user_id': user.id
			}, status=status.HTTP_200_OK)

		# Generate response
		return complete_login(user)
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
		succes, error = is_valid_username(serializer.validated_data['username'])
		if not succes:
			return JsonResponse({'error': error}, status=status.HTTP_400_BAD_REQUEST)
		succes, error = is_valid_password(serializer.validated_data['password'], None, serializer.validated_data['username'])
		if not succes:
			return JsonResponse({'error': error}, status=status.HTTP_400_BAD_REQUEST)
		# Profile picture
		id = User.objects.all().count() + 1
		serializer.validated_data['profile_picture'].name = f'{id}.png'
		user = serializer.save()

		# Generate response
		response = JsonResponse({'user': serializer.data}, status=status.HTTP_201_CREATED)
		refresh_token = generate_refresh_token(user)
		expires = datetime.datetime.utcnow() + datetime.timedelta(days=7)
		response.set_cookie('refresh_token', refresh_token, httponly=True, secure=False, samesite='Strict', expires=expires)
		access_token = generate_access_token(user)
		expires = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
		response.set_cookie('access_token', access_token, httponly=True, secure=False, samesite='Strict', expires=expires)
		return response
	else:
		error_messages = [str(error) for errors in serializer.errors.values() for error in errors]
		return Response({"error": error_messages[0]}, status=status.HTTP_400_BAD_REQUEST)

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

@swagger_auto_schema(
	method='get',
	request_body=None,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'qr_code': openapi.Schema(type=openapi.TYPE_STRING),
				'secret': openapi.Schema(type=openapi.TYPE_STRING)
			}
		),
		400 : openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'error': openapi.Schema(type=openapi.TYPE_STRING, description='2FA is already enabled')
			}
		)
	},
	operation_description="Generate a QR code and a secret for 2FA"
)
@api_view(['GET'])
def generate_2fa_qr_code(request):
	user = request.user

	if user.is_two_factor_enabled:
		return Response({'error': '2FA is already enabled'}, status=status.HTTP_400_BAD_REQUEST)

	secret = pyotp.random_base32()

	totp_uri = pyotp.TOTP(secret).provisioning_uri(
		name=user.email, issuer_name="Transcendence"
	)

	qr = qrcode.make(totp_uri)
	img = BytesIO()
	qr.save(img, format="PNG")
	qr_b64 = base64.b64encode(img.getvalue()).decode('utf-8')

	return Response({
		'qr_code': qr_b64,
		'secret': secret
	}, status=status.HTTP_200_OK)

@swagger_auto_schema(
	method='post',
	request_body=None,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'message': openapi.Schema(type=openapi.TYPE_STRING, description='2FA enabled successfully')
			}
		),
		400: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'error': openapi.Schema(type=openapi.TYPE_STRING, description='Invalid 2FA token or 2FA is already enabled')
			}
		)
	},
	description="Enable 2FA for a user."
)
@api_view(['POST'])
def enable_2fa(request):
	user = request.user
	token = request.data.get('token')
	secret = request.data.get('secret')

	if user.is_two_factor_enabled:
		return Response({'error': '2FA is already enabled'}, status=status.HTTP_400_BAD_REQUEST)

	totp = pyotp.TOTP(secret)
	if totp.verify(token):
		user.two_factor_secret = secret
		user.is_two_factor_enabled = True
		user.save()

		return Response({'message': '2FA enabled successfully'}, status=status.HTTP_200_OK)
	else:
		return Response({'error': 'Invalid 2FA token'}, status=status.HTTP_400_BAD_REQUEST)

@swagger_auto_schema(
	method='post',
	request_body=None,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'user': UserSerializer.user_swagger
			}
		),
		400: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'error': openapi.Schema(type=openapi.TYPE_STRING, description='Invalid 2FA token or 2FA is not enabled for this user or User doesn\'t exist')
			}
		)
	}
)
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_2fa_token(request):
	user_id = request.data.get('user_id')
	token = request.data.get('token')

	user = User.objects.filter(id=user_id).first()

	if user is None:
		return Response({"error": "User doesn't exist"}, status=status.HTTP_404_NOT_FOUND)

	if not user.is_two_factor_enabled:
		return Response({"error": "2FA is not enabled for this user"}, status=status.HTTP_400_BAD_REQUEST)

	totp = pyotp.TOTP(user.two_factor_secret)
	if totp.verify(token):
		return complete_login(user)
	else:
		return Response({"error": "Invalid 2FA token"}, status=status.HTTP_400_BAD_REQUEST)
	
@swagger_auto_schema(
	method='put',
	operation_description="Change user password",
	request_body=openapi.Schema(
		type=openapi.TYPE_OBJECT,
		properties={
			'password': openapi.Schema(type=openapi.TYPE_STRING, description='Current password'),
			'new_password': openapi.Schema(type=openapi.TYPE_STRING, description='New password'),
		},
		required=['password', 'new_password']
	),
	responses={
		200: openapi.Response(description="Password changed successfully"),
		400: openapi.Response(description="Invalid user type or incorrect current password"),
	}
)
@api_view(['PUT'])
def change_password(request):
	user = request.user
	password = request.data.get('password')
	new_password = request.data.get('new_password')

	if user.user_type != "email":
		return JsonResponse({'error': 'Invalid user type'}, status=status.HTTP_400_BAD_REQUEST)

	if not password or not new_password:
		return JsonResponse({'error': 'Password fields cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
	
	if check_password(password, user.password):
		user.password = make_password(new_password)
		user.save()
		return JsonResponse({'success': 'Password changed successfully'}, status=status.HTTP_200_OK)
	else:
		return JsonResponse({'error': 'Current password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)

@swagger_auto_schema(
	method='get',
	request_body=None,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'blockeds': openapi.Schema(
					type=openapi.TYPE_ARRAY,
					items=UserSerializer.user_swagger
				)
			}
		)
	},
	operation_description="Retrieve a list of blocked users from user_id"
)
@swagger_auto_schema(
	method='post',
	request_body=None,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'message': openapi.Schema(type=openapi.TYPE_STRING, description='User blocked successfully')
			}
		)
	},
	operation_description="Block user_id"
)
@swagger_auto_schema(
	method='delete',
	request_body=None,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'message': openapi.Schema(type=openapi.TYPE_STRING, description='User unblocked successfully')
			}
		)
	},
	operation_description="Unblock user_id"
)
@api_view(['GET', 'POST', 'DELETE'])
def block_user(request, user_id):
	user = request.user
	user_to_block = User.objects.filter(id=user_id).first()

	if user_to_block is None:
		return Response({"error": "User doesn'texist"}, status=status.HTTP_404_NOT_FOUND)

	if request.method == 'GET':
		users_serializer = UserSerializer(user.blocked_users.all(), many=True)
		return JsonResponse({'blockeds': users_serializer.data}, status=status.HTTP_200_OK)
	elif request.method == 'DELETE':
		user.blocked_users.remove(user_to_block)
		user.save()
		return JsonResponse({'message': 'User unblocked successfully'}, status=status.HTTP_200_OK)
	else :
		user.blocked_users.add(user_to_block)
		user.save()
		return JsonResponse({'message': 'User blocked successfully'}, status=status.HTTP_200_OK)

@swagger_auto_schema(
	method='get',
	request_body=None,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'friends': openapi.Schema(
					type=openapi.TYPE_ARRAY,
					items=UserSerializer.user_swagger
				)
			}
		)
	},
	operation_description="Retrieve a list of friends from user_id"
)
@swagger_auto_schema(
	method='post',
	request_body=None,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'message': openapi.Schema(type=openapi.TYPE_STRING, description='User blocked successfully')
			}
		)
	},
	operation_description="Add user_id as friend"
)
@swagger_auto_schema(
	method='delete',
	request_body=None,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'message': openapi.Schema(type=openapi.TYPE_STRING, description='User blocked successfully')
			}
		)
	},
	operation_description="Remove user_id from friends"
)
@api_view(['GET', 'POST', 'DELETE'])
def friend_user(request, user_id):
	user = request.user
	user_to_friend = User.objects.filter(id=user_id).first()
	if user_to_friend is None:
		return Response({"error": "User doesn'texist"}, status=status.HTTP_404_NOT_FOUND)

	if request.method == 'GET':
		users_serializer = UserSerializer(user_to_friend.friends.all(), many=True)
		return JsonResponse({'friends': users_serializer}, status=status.HTTP_200_OK)
	elif request.method == 'POST':
		user.friends.add(user_to_friend)
		user.save()
		return JsonResponse({'message': 'User blocked successfully'}, status=status.HTTP_200_OK)
	else:
		user.friends.remove(user_to_friend)
		user.save()
		return JsonResponse({'message': 'User blocked successfully'}, status=status.HTTP_200_OK)


@swagger_auto_schema(
	method='get',
	request_body=None,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'users': openapi.Schema(
					type=openapi.TYPE_ARRAY,
					items=UserSerializer.user_swagger
				)
			}
		)
	},
	operation_description="Retrieve a list of users that match the username"
)
@api_view(['GET'])
def search_user(request):
	query = request.GET.get('q', '')
	size = int(request.GET.get('size', '30'))
	if query:
		users = User.objects.filter(username__icontains=query)[:size]
		user_list = UserSerializer(users, many=True).data
		return JsonResponse({'users': user_list}, status=status.HTTP_200_OK)
	else:
		return JsonResponse({'users': []}, status=status.HTTP_200_OK)


def complete_login(user):
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
