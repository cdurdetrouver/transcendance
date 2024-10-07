from django.contrib import admin
from user.models import User
from pong.models import Game

admin.site.register(User)
admin.site.register(Game)
