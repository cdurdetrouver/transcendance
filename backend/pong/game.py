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
				"x": self.canvas_width - self.paddleWidth - 10,
				"y": (self.canvas_height - self.paddleHeight) / 2,
				"score": 0,
				"speed": 4
			},
			"player2": {
				"x": self.paddleWidth + 10,
				"y": (self.canvas_height - self.paddleHeight) / 2,
				"score": 0,
				"speed": 4
			},
			"ball": {
				"x": self.canvas_width / 2,
				"y": self.canvas_height / 2,
				"speed_x": 8,
				"speed_y": 8,
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
		self.lock_gamestate = asyncio.Lock()

		await self.channel_layer.group_send(
			self.group_name,
			{
				'type': 'game.started',
				'message': 'Game has started'
			}
		)
		while not self.game.finished:
			async with self.lock_gamestate:
				self.update_game_state()
				await self.channel_layer.group_send(
					self.group_name,
					{
						'type': 'game.update',
						'message': self.gameState
					}
				)
			await asyncio.sleep(1/60)

	def update_game_state(self):
		self.gameState["ball"]["x"] += self.gameState["ball"]["speed_x"]
		self.gameState["ball"]["y"] += self.gameState["ball"]["speed_y"]

		if self.gameState["ball"]["x"] < 0 or self.gameState["ball"]["x"] > self.canvas_width:
			self.gameState["ball"]["speed_x"] *= -1
		if self.gameState["ball"]["y"] < 0 or self.gameState["ball"]["y"] > self.canvas_height:
			self.gameState["ball"]["speed_y"] *= -1

	async def set_player_direction(self, player, data):
		async with self.lock_gamestate:
			directions = {
				"up": -self.gameState[player]["speed"],
				"down": self.gameState[player]["speed"]
			}
			self.gameState[player]["y"] += directions[data.direction]