def generate_random_roomname():
	import random
	import string
	return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

import re

def sanitize_group_name(name):
    sanitized_name = re.sub(r'[^a-zA-Z0-9\-_\.]', '_', name)
    return sanitized_name[:100]