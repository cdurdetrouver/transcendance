# from channels.auth import AuthMiddlewareStack
# from rest_framework.authtoken.models import Token
# from django.contrib.auth.models import AnonymousUser
# from django.db import close_old_connections
# import urllib.parse

# class TokenAuthMiddleware:

#     async def __init__(self, scope, middleware):
#         self.middleware = middleware
#         self.scope = dict(scope)
#         self.inner = self.middleware.inner

#     def __call__(self, receive, send):
#         decoded_qs = urllib.parse.parse_qs(self.scope["query_string"])
#         return await self.inner(self.scope, receive, send)


# TokenAuthMiddlewareStack = lambda inner: TokenAuthMiddleware(
#     AuthMiddlewareStack(inner))

# from django.contrib.auth.models import AnonymousUser

# from rest_framework.authtoken.models import Token

# from channels.auth import AuthMiddlewareStack
# from channels.db import database_sync_to_async

# import urllib.parse

# @database_sync_to_async
# def get_user(token):
#     try:
#         token = Token.objects.get(key=token)
#         return token.user
#     except Token.DoesNotExist:
#         return AnonymousUser()

# class TokenAuthMiddleware:
#     def __init__(self, inner):
#         self.inner = inner
#     def __call__(self, scope, test, lol):
#         return TokenAuthMiddlewareInstance(self, scope)


# class TokenAuthMiddlewareInstance:
#     """
#     Yeah, this is black magic:
#     https://github.com/django/channels/issues/1399
#     """
#     def __init__(self, scope, middleware):
#         self.middleware = middleware
#         self.scope = dict(scope)
#         self.inner = self.middleware.inner

#     def __call__(self, receive, send):
#         decoded_qs = urllib.parse.parse_qs(self.scope["query_string"])
#         if b'token' in decoded_qs:
#             token = decoded_qs.get(b'token').pop().decode()
#             self.scope['user'] =  get_user(token)
#         return self.inner(self.scope, receive, send)


# TokenAuthMiddlewareStack = lambda inner: TokenAuthMiddleware(AuthMiddlewareStack(inner))

from channels.db import database_sync_to_async

@database_sync_to_async
def get_user(user_id):
    # try:
    #     return User.objects.get(id=user_id)
    # except User.DoesNotExist:
    return ()

class QueryAuthMiddleware:
    """
    Custom middleware (insecure) that takes user IDs from the query string.
    """

    def __init__(self, app):
        # Store the ASGI application we were passed
        self.app = app

    async def __call__(self, scope, receive, send):
        # Look up user from query string (you should also do things like
        # checking if it is a valid user ID, or if scope["user"] is already
        # populated).
        print(scope['subprotocols'])
        print(receive)
        # scope['user'] = await get_user(int(scope["query_string"]))

        return await self.app(scope, receive, send)