from django.urls import re_path

from . import consumers

pong_websocket_urlpatterns = [
    re_path("ws/pong/", consumers.PongConsumer.as_asgi()),
]