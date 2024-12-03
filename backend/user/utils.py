import datetime
import jwt
import requests
import os
import re
import nltk
from nltk.corpus import words, names
from difflib import SequenceMatcher
import spacy
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

def get_intra_user(code):
	client_id = os.getenv('INTRA_ID')
	client_secret = os.getenv('INTRA_SECRET')
	redirect_uri = os.getenv('INTRA_REDIRECT_URI')
	url = 'https://api.intra.42.fr/oauth/token'
	data = {
		'grant_type': 'authorization_code',
		'client_id': client_id,
		'client_secret': client_secret,
		'code': code,
		'redirect_uri': redirect_uri,
	}
	response = requests.post(url, data=data)
	if response.status_code != 200:
		print(response.json())
		return None
	token = response.json().get('access_token')
	url = 'https://api.intra.42.fr/v2/me'
	headers = {
		'Authorization': f'Bearer {token}'
	}
	response = requests.get(url, headers=headers)
	if response.status_code != 200:
		return None
	user_info = response.json()
	user = AttributeDict(user_info)
	user_db = User.objects.filter(email=user.email).first()
	if user_db:
		return user_db
	else:
		return User.objects.create(
			username=user.login,
			email=user.email,
			picture_remote=user.image.get('link'),
			user_type='intra'
		)

def get_github_user(code):
	client_id = os.getenv('GITHUB_ID')
	client_secret = os.getenv('GITHUB_SECRET')
	url = 'https://github.com/login/oauth/access_token'
	data = {
		'client_id': client_id,
		'client_secret': client_secret,
		'code': code,
	}
	response = requests.post(url, params=data, headers={'Accept': 'application/json'})
	if response.status_code != 200:
		return None
	data = response.json()
	if 'error' in data:
		return None
	access_token = data.get('access_token')
	url = 'https://api.github.com/user'
	headers = {
		'Authorization': f'token {access_token}'
	}
	response = requests.get(url, headers=headers)
	if response.status_code != 200:
		return None
	user_info = response.json()
	user = AttributeDict(user_info)
	user_db = User.objects.filter(email=user.email).first()
	if user_db:
		return user_db
	else:
		return User.objects.create(
			username=user.login,
			email=user.email,
			picture_remote=user.avatar_url,
			user_type='github'
		)

def get_google_user(code):
	client_id = os.getenv('GOOGLE_ID')
	client_secret = os.getenv('GOOGLE_SECRET')
	redirect_uri = os.getenv('GOOGLE_REDIRECT_URI')
	url = 'https://oauth2.googleapis.com/token'
	data = {
		'client_id': client_id,
		'client_secret': client_secret,
		'code': code,
		'grant_type': 'authorization_code',
		'redirect_uri': redirect_uri,
	}

	response = requests.post(url, data=data)
	if response.status_code != 200:
		return None
	data = response.json()
	access_token = data.get('access_token')
	url = 'https://www.googleapis.com/oauth2/v2/userinfo'
	headers = {
		'Authorization': f'Bearer {access_token}'
	}
	response = requests.get(url, headers=headers)
	if response.status_code != 200:
		return None
	user_info = response.json()
	user = AttributeDict(user_info)
	user_db = User.objects.filter(email=user.email).first()
	if user_db:
		return user_db
	else:
		return User.objects.create(
			username=user.name,
			email=user.email,
			picture_remote=user.picture,
			user_type='google'
		)

def is_valid_username(username):
	message = ""

	existing_user = User.objects.filter(username=username).first()
	if existing_user:
		message ="Username is already taken."
		return False, message

	if len(username) < 3:
		message = "Username is too short. It should be at least 3 characters long."
		return False, message
	if len(username) > 15:
		message ="Username is too long. It should be no more than 15 characters long."
		return False, message

	if not username[0].isalpha():
		message ="Username should start with a letter."
		return False, message

	if not re.match("^[A-Za-z0-9_]+$", username):
		message ="Username should only contain letters, digits, and underscores (_)."
		return False, message

	return True, message

nltk.download('words')
nltk.download('names')

en_nlp = spacy.load('en_core_web_sm')
fr_nlp = spacy.load('fr_core_news_sm')

word_list = set(words.words())
name_list = set(names.words())

def is_dictionary_word_or_name(token):
	clean_token = token.lower()
	for word in word_list:
		if word in clean_token and len(word) > 4:
			print(word)
			return True
	for name in name_list:
		if name in clean_token and len(name) > 4:
			print(name)
			return True
	return False

def is_named_entity(token):
	doc = en_nlp(token)
	for ent in doc.ents:
		if ent.label_ in ["PERSON", "ORG", "PRODUCT", "GPE"]:
			return True
	doc = fr_nlp(token)
	for ent in doc.ents:
		if ent.label_ in ["PERSON", "ORG", "PRODUCT", "GPE"]:
			return True
	return False

def is_valid_password(password, last_password, username):
	message = ""

	if len(password) < 10:
		message = "Password is too short. It should be at least 10 characters long."
		return False, message

	if not re.search(r'[A-Z]', password):
		message = "Password should contain at least one uppercase letter."
		return False, message
	if not re.search(r'[a-z]', password):
		message = "Password should contain at least one lowercase letter."
		return False, message
	if not re.search(r'\d', password):
		message = "Password should contain at least one number."
		return False, message
	if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
		message = "Password should contain at least one special character (e.g., !, @, #, $, etc.)."
		return False, message

	if last_password and SequenceMatcher(None, password, last_password).ratio() > 0.7:
		message = "Password is not significantly different from your previous password."
		return False, message

	clean_password = re.sub(r'[^A-Za-z\s]', '', password)
	if is_dictionary_word_or_name(clean_password) or is_named_entity(clean_password):
		message = "Password is a dictionary word, or a name, or a product/organization name."
		return False, message

	if SequenceMatcher(None, username.lower(), clean_password.lower()).ratio() > 0.7:
		message = "Password should not contain username."
		return False, message

	return True, message
