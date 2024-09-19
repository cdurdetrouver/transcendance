import threading
import asyncio
import time
from asgiref.sync import async_to_sync

BALL_RADIUS = 8
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 400
PADDLE_WIDTH = 10
PADDLE_HEIGHT = 80

class Ball:
	def __init__(self, x, y, speed):
		self.default_position = [x, y]
		self.default_velocity = [speed, speed]

		self.position = self.default_position
		self.velocity = self.default_velocity

	def update(self, delta_time):
		self.position[0] += self.velocity[0] * delta_time
		self.position[1] += self.velocity[1] * delta_time

	def check_collision(self, paddle):
		ball_future_pos = [self.position[0] + self.velocity[0], self.position[1] + self.velocity[1]]
		if (ball_future_pos[0] - BALL_RADIUS < paddle.position[0] + PADDLE_WIDTH and
			paddle.position[0] < ball_future_pos[0] + BALL_RADIUS and
			ball_future_pos[1] - BALL_RADIUS < paddle.position[1] + PADDLE_HEIGHT and
			paddle.position[1] < ball_future_pos[1] + BALL_RADIUS):
			return True
		return False

	def reset(self):
		self.position = self.default_position
		self.velocity = self.default_velocity

class Paddle:
	def __init__(self, x, y, speed):
		self.default_position = [x, y]
		self.position = self.default_position
		self.speed = speed

	def move(self, delta_time, direction):
		if direction == 'up' and self.position[1] > 0:
			self.position[1] -= self.speed * delta_time
		elif direction == 'down' and self.position[1] < SCREEN_HEIGHT - PADDLE_HEIGHT:
			self.position[1] += self.speed * delta_time

	def reset(self):
		self.position = self.default_position

class GameThread(threading.Thread):
	def __init__(self, game, group_name, channel_layer):
		super(GameThread, self).__init__(daemon=True, name=f"Game_{group_name}")
		self.game = game
		self.group_name = group_name
		self.channel_layer = channel_layer
		self._stop_event = threading.Event()

		self.ball = Ball(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 200)
		self.paddle1 = Paddle(0, SCREEN_HEIGHT / 2, 150)
		self.paddle2 = Paddle(SCREEN_WIDTH - PADDLE_WIDTH, SCREEN_HEIGHT / 2, 150)

	def __str__(self):
		string = f"{self.group_name} - {self.game.player1_id} vs {self.game.player2_id} | score: {self.game.player1_score} - {self.game.player2_score}"
		if self.game.finished:
			string += f" - Winner: {self.game.winner_id}"
		return string

	def serialize(self):
		return {
			"player1": {
				"x": self.paddle1.position[0],
				"y": self.paddle1.position[1],
				"speed": self.paddle1.speed,
				"score": self.game.player1_score
			},
			"player2": {
				"x": self.paddle2.position[0],
				"y": self.paddle2.position[1],
				"speed": self.paddle2.speed,
				"score": self.game.player2_score
			},
			"ball": {
				"x": self.ball.position[0],
				"y": self.ball.position[1],
				"speed_x": self.ball.velocity[0],
				"speed_y": self.ball.velocity[1]
			}
		}

	def run(self):
		async_to_sync(self.channel_layer.group_send)(
			self.group_name,
			{
				'type': 'game.started',
				'message': 'Game has started'
			}
		)
		print("Game started")
		last_time = time.time()
		while not self._stop_event.is_set():
			try :
				current_time = time.time()
				self.delta_time = current_time - last_time
				last_time = current_time

				self.ball.update(self.delta_time)

				if self.ball.position[1] - BALL_RADIUS < 0 or self.ball.position[1] + BALL_RADIUS > SCREEN_HEIGHT:
					self.ball.velocity[1] = -self.ball.velocity[1]

				if self.ball.check_collision(self.paddle1):
					self.ball.velocity[0] = -self.ball.velocity[0]
				
				if self.ball.check_collision(self.paddle2):
					self.ball.velocity[0] = -self.ball.velocity[0]

				if self.ball.position[0] - BALL_RADIUS < 0 :
					self.game.player2_score += 1
					self.ball.reset()

				if self.ball.position[0] + BALL_RADIUS > SCREEN_WIDTH:
					self.game.player1_score += 1
					self.ball.reset()

				async_to_sync(self.channel_layer.group_send)(
					self.group_name,
					{
						'type': 'game.update',
						'message': self.serialize()
					}
				)
				time.sleep(max(1.0 / 60 - self.delta_time, 0))
			except Exception as e:
				print(e)
				break

	async def set_player_direction(self, player, data):
		if player == "player1":
			self.paddle1.move(self.delta_time, data["direction"])
		else:
			self.paddle2.move(self.delta_time, data["direction"])

	def stop(self):
		self._stop_event.set()
