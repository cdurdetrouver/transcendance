from django.urls import re_path
from pong.consumers import PongConsumer
from chat.consumers import ChatConsumer

websocket_urlpatterns = [
	re_path("ws/chat/", ChatConsumer.as_asgi()),
	re_path("ws/pong/", PongConsumer.as_asgi()),
]