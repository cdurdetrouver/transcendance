from django.db import models

class Game(models.Model):

	room_name = models.CharField(max_length=255)
	finished = models.BooleanField(default=False)
	started = models.BooleanField(default=False)
	nb_players = models.IntegerField(default=0)
	nb_viewers = models.IntegerField(default=0)
	player1_id = models.IntegerField()
	player2_id = models.IntegerField()
	winner_id = models.IntegerField(null=True)
	player1_score = models.IntegerField(default=0)
	player2_score = models.IntegerField(default=0)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):

		string = f"{self.room_name} - {self.player1_id} vs {self.player2_id} | score: {self.player1_score} - {self.player2_score}"
		if self.finished:
			string += f" - Winner: {self.winner_id}"
		return string
