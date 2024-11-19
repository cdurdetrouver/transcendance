from django.db import models
from user.models import User

class Game(models.Model):

	room_name = models.CharField(max_length=255)
	finished = models.BooleanField(default=False)
	started = models.BooleanField(default=False)
	nb_players = models.IntegerField(default=0)
	player1 = models.ForeignKey(User, related_name='games_as_player1', on_delete=models.SET_NULL, null=True, blank=True)
	player2 = models.ForeignKey(User, related_name='games_as_player2', on_delete=models.SET_NULL, null=True, blank=True)
	winner = models.ForeignKey(User, related_name='games_won', on_delete=models.SET_NULL, null=True, blank=True)
	player1_score = models.IntegerField(default=0)
	player2_score = models.IntegerField(default=0)
	player1_character = models.TextField(default='0')
	player2_character = models.TextField(default='0')
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		string = f"{self.room_name} - {self.player1.username if self.player1 else 'N/A'} vs {self.player2.username if self.player2 else 'N/A'} | score: {self.player1_score} - {self.player2_score}"
		if self.finished:
			string += f" - Winner: {self.winner.username if self.winner else 'N/A'}"
		return string

	def get_other_player(self, user):
		if user == self.player1:
			return self.player2
		elif user == self.player2:
			return self.player1
		else:
			return None
