from .settings_base import *

DEBUG = True

ALLOWED_HOSTS = [
    'dev-pong.cdurdetrouver.fr',
    'www.dev-pong.cdurdetrouver.fr'
]

CORS_ALLOWED_ORIGINS = [
    'http://dev-pong.cdurdetrouver.fr',
    'http://www.dev-pong.cdurdetrouver.fr',
]