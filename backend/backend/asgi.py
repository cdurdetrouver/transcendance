"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

# mysite/asgi.py
import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.

from chat.routing import chat_websocket_urlpatterns
from pong.routing import pong_websocket_urlpatterns
combined_websocket_urlpatterns = chat_websocket_urlpatterns + pong_websocket_urlpatterns

application = ProtocolTypeRouter(
    {
        "http":  get_asgi_application(),
        "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(URLRouter(combined_websocket_urlpatterns))
        ),
    }
)
