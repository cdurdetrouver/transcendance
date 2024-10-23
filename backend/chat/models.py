from django.db import models
from user.models import User

from user.models import User

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
	name = models.CharField(max_length=128, blank=True)
	group_name = models.CharField(max_length=100, blank=True)
	created_by =  models.ForeignKey(User, related_name='room_admin', on_delete=models.SET_NULL, null=True, blank=True)
	messages = models.ManyToManyField(Message, blank=True)
	participants =  models.ManyToManyField(User, blank=True, symmetrical=False, related_name='room_participant')
	room_picture = models.ImageField(upload_to='room_pictures/', null=True, blank=True)

	def save(self, *args, **kwargs):
		if self.room_picture:
			try:
				this = Room.objects.get(id=self.id)
				if this.room_picture != self.room_picture:
					this.room_picture.delete()
			except:
				pass
		elif not self.room_picture:
			try:
				this = Room.objects.get(id=self.id)
				self.room_picture = this.room_picture
			except:
				pass
		super().save(*args, **kwargs)

	def __str__(self):
		return self.name