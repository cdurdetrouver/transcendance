def generate_random_roomname():
	import random
	import string
	return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
