from rest_framework import serializers
from .models import Game
from drf_yasg import openapi
from user.serializers import UserSerializer

class GameSerializer(serializers.ModelSerializer):
	player1 = UserSerializer(read_only=True)
	player2 = UserSerializer(read_only=True)
	winner = UserSerializer(read_only=True)

	game_swagger = openapi.Schema(
		type=openapi.TYPE_OBJECT,
		properties={
			'id': openapi.Schema(type=openapi.TYPE_INTEGER),
			'room_name': openapi.Schema(type=openapi.TYPE_STRING),
			'finished': openapi.Schema(type=openapi.TYPE_BOOLEAN),
			'started': openapi.Schema(type=openapi.TYPE_BOOLEAN),
			'nb_players': openapi.Schema(type=openapi.TYPE_INTEGER),
			'player1': UserSerializer.user_swagger,
			'player2': UserSerializer.user_swagger,
			'winner': UserSerializer.user_swagger,
			'player1_score': openapi.Schema(type=openapi.TYPE_INTEGER),
			'player2_score': openapi.Schema(type=openapi.TYPE_INTEGER),
			'created_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
			'updated_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
		}
	)

	class Meta:
		model = Game
		fields = [
			'id', 'room_name', 'finished', 'started', 'nb_players',
			'player1', 'player2', 'winner', 'player1_score', 'player2_score',
			'created_at', 'updated_at'
		]
