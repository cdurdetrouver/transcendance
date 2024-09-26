from django.urls import re_path
from pong.consumers import PongConsumer, MatchmakingConsumer
from chat.consumers import ChatConsumer

websocket_urlpatterns = [
	re_path(r'ws/chat/(?P<room_id>[\w.!]+)/$', ChatConsumer.as_asgi()),
	re_path("ws/pong/matchmaking/", MatchmakingConsumer.as_asgi()),
	re_path(r'ws/pong/(?P<room_name>[\w.!]+)/$', PongConsumer.as_asgi()),
]
