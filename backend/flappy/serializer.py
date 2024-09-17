from rest_framework import serializers
from .models import Leaderboard

class LeaderboardSerializer(serializers.ModelSerializer):
	class Meta:
		model = Leaderboard
		fields = ['id', ]

