import datetime
import jwt
from django.conf import settings
from user.models import User

def generate_access_token(user):
	access_token_payload = {
		'user_id': user.id,
		'exp': datetime.datetime.utcnow() + datetime.timedelta(days=0, minutes=5),
		'iat': datetime.datetime.utcnow(),
	}
	access_token = jwt.encode(access_token_payload, settings.SECRET_KEY, algorithm='HS256')
	return access_token


def generate_refresh_token(user):
	refresh_token_payload = {
		'user_id': user.id,
		'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
		'iat': datetime.datetime.utcnow()
	}
	refresh_token = jwt.encode(refresh_token_payload, settings.SECRET_KEY, algorithm='HS256')
	return refresh_token

class AttributeDict(dict):
	def __getattr__(self, item):
		try:
			return self[item]
		except KeyError:
			raise AttributeError(f"'AttributeDict' object has no attribute '{item}'")

	def __setattr__(self, key, value):
		self[key] = value

	def __delattr__(self, item):
		try:
			del self[item]
		except KeyError:
			raise AttributeError(f"'AttributeDict' object has no attribute '{item}'")

def get_user_by_token(token):
	try:
		payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
		user_id = payload.get('user_id')
		user = User.objects.get(id=user_id)
		if user is None:
			return False, 'User not found'
		return True, user
	except jwt.ExpiredSignatureError:
		return False, 'Token expired. Please log in again.'
	except jwt.InvalidTokenError:
		return False, 'Invalid token. Please log in again.'
	except jwt.InvalidSignatureError:
		return False, 'Invalid signature. Please log in again.'
	except jwt.InvalidAlgorithmError:
		return False, 'Invalid algorithm. Please log in again.'
	except jwt.DecodeError:
		return False, 'Decode error. Please log in again.'
	except Exception as e:
		return False, str(e)

def get_from_cookies(cookies, search_key):
	if not cookies:
		return None

	cookie_list = cookies.split('; ')

	cookie_dict = {}
	for cookie in cookie_list:
		key, value = cookie.split('=', 1)
		cookie_dict[key] = value

	return cookie_dict.get(search_key)
