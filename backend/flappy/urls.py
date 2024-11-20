from django.urls import path
from flappy import views

urlpatterns = [
    path('games/', views.game_detail),
    path('games/<int:game_id>/', views.game_id),
]