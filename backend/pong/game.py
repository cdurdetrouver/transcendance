import threading
import asyncio

class GameThread(threading.Thread):
	def __init__(self, game, group_name, channel_layer):
		super(GameThread, self).__init__(daemon=True, name=f"Game_{group_name}")
		self.game = game
		self.group_name = group_name
		self.channel_layer = channel_layer
		self.canvas_width = 800
		self.canvas_height = 400
		self.paddleWidth = 10
		self.paddleHeight = 75
		self.ballRadius = 8
		self.gameState = {
			"player1": {
				"x": 0,
				"y": 0,
				"score": 0,
				"speed": 0
			},
			"player2": {
				"x": 0,
				"y": 0,
				"score": 0,
				"speed": 0
			},
			"ball": {
				"x": 0,
				"y": 0,
				"speed": 0,
				"angle": 0
			}
		}

	def __str__(self):
		string = f"{self.group_name} - {self.game.player1_id} vs {self.game.player2_id} | score: {self.game.player1_score} - {self.game.player2_score}"
		if self.game.finished:
			string += f" - Winner: {self.game.winner_id}"
		return string

	def run(self):
		loop = asyncio.new_event_loop()
		asyncio.set_event_loop(loop)

		loop.run_until_complete(self.main_loop())
		loop.close()

	async def main_loop(self):
		await self.channel_layer.group_send(
			self.group_name,
			{
				'type': 'game.started',
				'message': 'Game has started'
			}
		)
		while not self.game.finished:
			await self.channel_layer.group_send(
				self.group_name,
				{
					'type': 'game.update',
					'message': self.gameState
				}
			)
			await asyncio.sleep(1)
