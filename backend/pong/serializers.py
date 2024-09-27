from rest_framework import serializers
from .models import Game
from drf_yasg import openapi

class GameSerializer(serializers.ModelSerializer):
	game_swagger=openapi.Schema(
		type=openapi.TYPE_OBJECT,
		properties={
			'id': openapi.Schema(type=openapi.TYPE_INTEGER),
			'room_name': openapi.Schema(type=openapi.TYPE_STRING),
			'finished': openapi.Schema(type=openapi.TYPE_BOOLEAN),
			'started': openapi.Schema(type=openapi.TYPE_BOOLEAN),
			'nb_players': openapi.Schema(type=openapi.TYPE_INTEGER),
			'nb_viewers': openapi.Schema(type=openapi.TYPE_INTEGER),
			'player1_id': openapi.Schema(type=openapi.TYPE_INTEGER),
			'player2_id': openapi.Schema(type=openapi.TYPE_INTEGER),
			'winner_id': openapi.Schema(type=openapi.TYPE_INTEGER),
			'player1_score': openapi.Schema(type=openapi.TYPE_INTEGER),
			'player1_score': openapi.Schema(type=openapi.TYPE_INTEGER),
			'created_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
			'updated_at': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
		}
	)

	class Meta:
		model = Game
		fields = ['id', 'room_name', 'finished', 'started', 'nb_players', 'nb_viewers', 'player1_id', 'player2_id', 'winner_id', 'player1_score','player2_score', 'created_at', 'updated_at']
