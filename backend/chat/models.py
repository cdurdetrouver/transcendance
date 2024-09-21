from django.db import models
from user.models import User

# Create your models here.
class Message(models.Model):
	TYPES = [
		('chat', 'Chat'),
		('announce', 'Announce'),
	]

	author = models.CharField(max_length=128, default='none')
	message_type = models.CharField(max_length=10, choices=TYPES, default='chat')
	content = models.CharField(max_length=128)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return self.content + " Je suis une classe"

class Room (models.Model):
	name = models.CharField(max_length=128)
	participants = models.ManyToManyField(
		User, related_name='rooms', blank=True)
	messages = models.ManyToManyField(Message, blank=True)

	def __str__(self):
		return self.name