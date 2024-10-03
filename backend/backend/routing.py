from django.urls import re_path
from pong.consumers import PongConsumer, MatchmakingConsumer, PrivateMatchmakingConsumer
from chat.consumers import ChatConsumer

websocket_urlpatterns = [
	re_path("ws/chat/", ChatConsumer.as_asgi()),
	re_path("ws/pong/matchmaking/", MatchmakingConsumer.as_asgi()),
    re_path(r"ws/pong/privatematchmaking/(?P<room_name>[\w.!]+)/$", PrivateMatchmakingConsumer.as_asgi()),
	re_path(r'ws/pong/(?P<room_name>[\w.!]+)/$', PongConsumer.as_asgi()),
]
