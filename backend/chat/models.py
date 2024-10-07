from django.db import models

from user.models import User
from django.contrib.postgres.fields import ArrayField

# Create your models here.
class Message(models.Model):
	TYPES = [
		('chat', 'Chat'),
		('announce', 'Announce'),
	]

	author =  models.ForeignKey(User, related_name='message_author', on_delete=models.SET_NULL, null=True, blank=True)
	message_type = models.CharField(max_length=10, choices=TYPES, default='chat')
	content = models.CharField(max_length=128)
	send_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return self.content

class Room (models.Model):
	name = models.CharField(max_length=128)
	created_by =  models.ForeignKey(User, related_name='room_admin', on_delete=models.SET_NULL, null=True, blank=True)
	messages = models.ManyToManyField(Message, blank=True)
	participants =  models.ManyToManyField(User, blank=True, related_name='room_participant')

	def __str__(self):
		return self.name