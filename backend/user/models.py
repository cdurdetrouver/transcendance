from django.db import models
from django.contrib.auth.hashers import make_password

class User(models.Model):
	USER_TYPE_CHOICES = [
		('email', 'Email'),
		('google', 'Google'),
		('github', 'GitHub'),
	]

	username = models.CharField(max_length=50)
	email = models.EmailField()
	password = models.CharField(max_length=128)
	user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='email')
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def save(self, *args, **kwargs):
		if not self.pk and self.user_type == 'email':
			self.password = make_password(self.password)
		super().save(*args, **kwargs)

	def __str__(self):
		return self.username
