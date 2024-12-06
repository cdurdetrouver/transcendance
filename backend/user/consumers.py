import json

from channels.generic.websocket import AsyncWebsocketConsumer

from asgiref.sync import sync_to_async

from .utils import get_user_by_status_token

class UserStatusConsumer(AsyncWebsocketConsumer):
	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self.user = None

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
		await sync_to_async(self.user.__class__.objects.filter(pk=self.user.pk).update)(online=True)

		await self.send(text_data=json.dumps({
			'type': 'success',
			'message': 'Connected'
		}))

	async def disconnect(self, code):
		if self.user:
			await sync_to_async(self.user.__class__.objects.filter(pk=self.user.pk).update)(online=False)
