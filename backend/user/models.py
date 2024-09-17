from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.contrib.auth.hashers import make_password

class User(AbstractUser):
	USER_TYPE_CHOICES = [
		('email', 'Email'),
		('google', 'Google'),
		('github', 'GitHub'),
	]

	user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='email')
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	groups = models.ManyToManyField(Group, related_name='custom_user_set')
	user_permissions = models.ManyToManyField(Permission, related_name='custom_user_set')

	best_score =  models.IntegerField(default=0)

	def save(self, *args, **kwargs):
		if not self.pk and self.user_type == 'email':
			self.password = make_password(self.password)
		super().save(*args, **kwargs)

	def __str__(self):
		return self.username
