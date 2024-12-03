import jwt
from rest_framework.authentication import BaseAuthentication
from django.middleware.csrf import CsrfViewMiddleware
from rest_framework import exceptions
from django.conf import settings
from .models import User
from .utils import get_from_cookies

class SafeJWTAuthentication(BaseAuthentication):

	def authenticate(self, request):

		cookies = request.headers.get('Cookie')
		if not cookies:
			return None
		try :
			access_token = get_from_cookies(cookies, 'access_token')
			if not access_token:
				return None
			payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=['HS256'])

		except jwt.ExpiredSignatureError:
			raise exceptions.AuthenticationFailed('access_token expired')
		except IndexError:
			raise exceptions.AuthenticationFailed('Token prefix missing')

		user = User.objects.filter(id=payload['user_id']).first()
		if user is None:
			raise exceptions.AuthenticationFailed('User not found')

		if not user.is_active:
			raise exceptions.AuthenticationFailed('user is inactive')

		# self.enforce_csrf(request)
		return (user, None)

	def enforce_csrf(self, request):
		check = CsrfViewMiddleware(get_response=lambda request: None)
		reason = check.process_view(request, None, (), {})
		if reason:
			raise exceptions.PermissionDenied('CSRF Failed: %s' % reason)
