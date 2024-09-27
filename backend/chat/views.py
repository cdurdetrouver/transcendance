from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from twisted.application.runner.test.test_pidfile import ifPlatformSupported
from autobahn.wamp import request
from django.http import JsonResponse
from .serializers import RoomSerializer
from user.serializers import UserSerializer
from .models import Room
from rest_framework.response import Response
import json
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

@swagger_auto_schema(
	method='get',
	request_body=None,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'rooms': openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=RoomSerializer.room_swagger
				)
			}
		)
	},
	operation_description="Retrieve a list of chat for user"
)
@api_view(['GET'])
def get_user_chats(request):
    user = request.user
    rooms = Room.objects.filter(participants_id__contains=[user.id])
    print(rooms)
    if (not rooms.exists()):
        return Response({"error": "not room found"}, status=status.HTTP_404_NOT_FOUND)
    rooms_s = (RoomSerializer(rooms, many=True)).data
    print(rooms_s)
    response = JsonResponse({'rooms': rooms_s}, status=status.HTTP_200_OK)
    return response

@api_view()
def websocket_connect(request):
    # Vérifiez si la requête est bien une connexion WebSocket
    if not request.is_web_socket():
        return HttpResponse(status=400)

    # Récupérez l'access token du payload
    try:
        data = json.loads(request.body)
        access_token = data['accessToken']
    except (KeyError, json.JSONDecodeError):
        return HttpResponse(status=400)