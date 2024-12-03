from django.urls import re_path
from pong.consumers import PongConsumer, MatchmakingConsumer, PrivateMatchmakingConsumer
from flappy.consumers import FlappyConsumer, FlappyMatchmakingConsumer
from chat.consumers import ChatConsumer

websocket_urlpatterns = [
	re_path(r'ws/chat/(?P<room_id>[\w.!]+)/$', ChatConsumer.as_asgi()),
	re_path("ws/pong/matchmaking/", MatchmakingConsumer.as_asgi()),
	re_path(r"ws/pong/privatematchmaking/(?P<room_name>[\w.!]+)/$", PrivateMatchmakingConsumer.as_asgi()),
	re_path(r'ws/pong/(?P<room_name>[\w.!]+)/$', PongConsumer.as_asgi()),
	re_path("ws/flappy/matchmaking/", FlappyMatchmakingConsumer.as_asgi()),
	# re_path(r"ws/flappy/privatematchmaking/(?P<room_name>[\w.!]+)/$", FlappyPrivateMatchmaking.as_asgi()),
	re_path(r'ws/flappy/(?P<room_name>[\w.!]+)/$', FlappyConsumer.as_asgi()),
]
