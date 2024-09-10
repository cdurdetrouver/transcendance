from django.db import models

# Create your models here.
class Message(models.Model):
	TYPES = [
		'chat',
		'annonce'
	]

	user_id = models.IntegerField()
	type = models.CharField(max_length=10, choices=TYPES, default='chat')
	content = models.CharField(max_length=128)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return self.content