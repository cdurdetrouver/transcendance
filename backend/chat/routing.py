from django.urls import re_path

from . import consumers

chat_websocket_urlpatterns = [
    re_path("ws/chat/", consumers.ChatConsumer.as_asgi()),
]