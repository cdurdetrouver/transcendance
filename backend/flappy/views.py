from django.shortcuts import render

# Create your views here.
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
from .models import FlappyGame
from .serializers import FlappyGameSerializer

@swagger_auto_schema(
	method='get',
	request_body=None,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
					'games': openapi.Schema(
					type=openapi.TYPE_ARRAY,
					items=FlappyGameSerializer.game_swagger
				)
			}
		),
		400: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'error': openapi.Schema(type=openapi.TYPE_STRING, description="Invalid credentials or validation error")
			}
		)
	},
	operation_description="Retrieve a list of games where the winner is not yet determined"
)
@api_view(['GET'])
def game_detail(request):

	games = FlappyGame.objects.filter(finished=False, started=True)
	serialized_games = FlappyGameSerializer(games, many=True)

	return JsonResponse({'games': serialized_games.data}, status=status.HTTP_200_OK)


@swagger_auto_schema(
	method='get',
	request_body=None,
	responses={
		200: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'game':FlappyGameSerializer.game_swagger
			}
		),
		404: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'error': openapi.Schema(type=openapi.TYPE_STRING, description="Game doesn't exist")
			}
		),
		400: openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				'error': openapi.Schema(type=openapi.TYPE_STRING, description="Invalid credentials or validation error")
			}
		)
	},
	operation_description="Retrieve a game by id"
)
@api_view(['GET'])
def game_id(request, game_id):
	game = FlappyGame.objects.filter(id=game_id).first()
	if game is None:
		return Response({"error": "Game doesn't exist"}, status=status.HTTP_404_NOT_FOUND)
	serialized_game = FlappyGameSerializer(game)
	return JsonResponse({'game': serialized_game.data}, status=status.HTTP_200_OK)
