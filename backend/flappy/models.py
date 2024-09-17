from typing import Any
from django.db import models

# Create your models here.
class Leaderboard(models.Model):
	user  = models.CharField(max_length=200)
	score = models.IntegerField()

	def __str__(self):
		return self.user
