from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.contrib.auth.hashers import make_password
from django.contrib.postgres.fields.array import ArrayField

class User(AbstractUser):
	USER_TYPE_CHOICES = [
		('email', 'Email'),
		('intra', 'Intra'),
		('github', 'Github'),
		('google', 'Google'),
	]

	user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='email')
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)
	last_login = models.DateTimeField(auto_now=True)

	profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
	picture_remote = models.URLField(null=True, blank=True)

	groups = models.ManyToManyField(Group, related_name='custom_user_set')
	user_permissions = models.ManyToManyField(Permission, related_name='custom_user_set')

	two_factor_secret = models.CharField(max_length=32, blank=True, null=True)
	is_two_factor_enabled = models.BooleanField(default=False)
	blocked_users = models.ManyToManyField('self', symmetrical=False, related_name='blocked_by', blank=True)
	friends = models.ManyToManyField('self', symmetrical=False, related_name='friends_with', blank=True)
	invite_list_id = ArrayField(models.IntegerField(), blank=True, null=True)

	wins = models.IntegerField(default=0)
	looses = models.IntegerField(default=0)

	def save(self, *args, **kwargs):
		if not self.pk and self.user_type == 'email' and self.password:
			self.password = make_password(self.password)
		if self.user_type != 'email':
			self.password = ''
		if self.profile_picture:
			try:
				this = User.objects.get(id=self.id)
				if this.profile_picture != self.profile_picture:
					this.profile_picture.delete()
			except:
				pass
		super().save(*args, **kwargs)

	def __str__(self):
		return self.username
