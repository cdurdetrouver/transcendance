from django.http import HttpResponse
from rest_framework.decorators import api_view
from django.views.decorators.csrf import csrf_exempt
from twisted.application.runner.test.test_pidfile import ifPlatformSupported
from autobahn.wamp import request
import json

@swagger_auto_schema(
	method='get',
	request_body=None,
	responses={
		200:"ok"
	},
	manual_parameters=[
		openapi.Parameter(
			'Authorization',
			openapi.IN_HEADER,
			description="Authorization token",
			type=openapi.TYPE_STRING,
			default='Bearer <token>'
		)
	],
	operation_description="Retrieve a list of chat for user"
)

@api_view(['GET', 'POST'])
def get_user_chats(request):
    if request.method == 'GET':
        user = request.user
        print(user)

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