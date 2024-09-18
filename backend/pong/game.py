import threading
import asyncio

class GameThread(threading.Thread):
	def __init__(self, game, group_name, channel_layer, loop):
		super(GameThread, self).__init__(daemon=True, name=f"Game_{group_name}")
		self.game = game
		self.group_name = group_name
		self.channel_layer = channel_layer
		self.loop = loop
		self._stop_event = threading.Event()

		self.canvas_width = 800
		self.canvas_height = 400
		self.paddleWidth = 10
		self.paddleHeight = 75
		self.ballRadius = 8
		self.gameState = {
			"player1": {
				"x": self.paddleWidth + 10,
				"y": (self.canvas_height - self.paddleHeight) / 2,
				"score": 0,
				"speed": 4
			},
			"player2": {
				"x": self.canvas_width - self.paddleWidth - 10,
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
		asyncio.run_coroutine_threadsafe(self.main_loop(), self.loop)

	async def main_loop(self):

		await self.channel_layer.group_send(
			self.group_name,
			{
				'type': 'game.started',
				'message': 'Game has started'
			}
		)
		print("Game started")
		while not self._stop_event.is_set():
			try :
				self.update_game_state()
				await self.channel_layer.group_send(
					self.group_name,
					{
						'type': 'game.update',
						'message': self.gameState
					}
				)
				await asyncio.sleep(1/60)
			except Exception as e:
				print(e)
				break

	def is_collision(self, ball_x, ball_y, paddle_x, paddle_y):
		closest_x = max(paddle_x, min(ball_x, paddle_x + self.paddleWidth))
		closest_y = max(paddle_y, min(ball_y, paddle_y + self.paddleHeight))

		distance_x = ball_x - closest_x
		distance_y = ball_y - closest_y

		distance_squared = distance_x**2 + distance_y**2

		return distance_squared < self.ballRadius**2

	def update_game_state(self):
		self.gameState["ball"]["x"] += self.gameState["ball"]["speed_x"]
		self.gameState["ball"]["y"] += self.gameState["ball"]["speed_y"]

		if self.gameState["ball"]["y"] - self.ballRadius < 0 or self.gameState["ball"]["y"] + self.ballRadius > self.canvas_height:
			self.gameState["ball"]["speed_y"] *= -1

		if self.gameState["ball"]["x"] - self.ballRadius < 0:
			self.gameState["player2"]["score"] += 1
			self.gameState["ball"]["x"] = self.canvas_width / 2
			self.gameState["ball"]["y"] = self.canvas_height / 2
			self.gameState["ball"]["speed_x"] *= -1
		elif self.gameState["ball"]["x"] + self.ballRadius > self.canvas_width:
			self.gameState["player1"]["score"] += 1
			self.gameState["ball"]["x"] = self.canvas_width / 2
			self.gameState["ball"]["y"] = self.canvas_height / 2
			self.gameState["ball"]["speed_x"] *= -1

		if self.gameState["ball"]["x"] < self.canvas_width / 4:
			if self.is_collision(self.gameState["ball"]["x"], self.gameState["ball"]["y"], self.gameState["player1"]["x"], self.gameState["player1"]["y"]):
				self.gameState["ball"]["speed_x"] *= -1
		elif self.gameState["ball"]["x"] > self.canvas_width * 3 / 4:
			if self.is_collision(self.gameState["ball"]["x"], self.gameState["ball"]["y"], self.gameState["player2"]["x"], self.gameState["player2"]["y"]):
				self.gameState["ball"]["speed_x"] *= -1



	async def set_player_direction(self, player, data):
		directions = {
			"up": -self.gameState[player]["speed"],
			"down": self.gameState[player]["speed"]
		}
		self.gameState[player]["y"] += directions[data["direction"]]

		if self.gameState[player]['y'] < 0:
			self.gameState[player]['y'] = 0
		elif self.gameState[player]['y'] > self.canvas_height - self.paddleHeight:
			self.gameState[player]['y'] = self.canvas_height - self.paddleHeight

	def stop(self):
		self._stop_event.set()
