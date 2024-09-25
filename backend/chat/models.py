from django.db import models

from user.models import User
from django.contrib.postgres.fields import ArrayField

# Create your models here.
class Message(models.Model):
	TYPES = [
		('chat', 'Chat'),
		('announce', 'Announce'),
	]

	author_id =  models.IntegerField(blank=False) 
	message_type = models.CharField(max_length=10, choices=TYPES, default='chat')
	content = models.CharField(max_length=128)
	send_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return self.content

class Room (models.Model):
	name = models.CharField(max_length=128)
	participants_id = ArrayField(models.IntegerField(null=True, blank=False), blank=True, default=list)
	messages_id = ArrayField(models.IntegerField(null=True, blank=False), blank=True, default=list)

	def __str__(self):
		return self.name