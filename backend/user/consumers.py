import json

from channels.generic.websocket import AsyncWebsocketConsumer

from asgiref.sync import sync_to_async

from .utils import get_user_by_status_token

class UserStatusConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		status_token = self.scope['cookies'].get('status_token')

		success, result = await sync_to_async(get_user_by_status_token)(status_token)
		await self.accept()
		if not success:
			await self.send(text_data=json.dumps({
				'type': 'error',
				'message': result
			}))
			await self.close()
			return
		self.user = result
		self.user.online = True
		await sync_to_async(self.user.save)()

		await self.send(text_data=json.dumps({
			'type': 'success',
			'message': 'Connected'
		}))

	async def disconnect(self, code):
		self.user.online = False
		await sync_to_async(self.user.save)()

