from django.urls import path
from pong import views

urlpatterns = [
    path('games/', views.game_detail),
]
