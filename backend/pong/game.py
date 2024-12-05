import threading
import time
import random
import asyncio
from asgiref.sync import async_to_sync, sync_to_async

BALL_RADIUS = 8
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 400
PADDLE_WIDTH = 56
PADDLE_HEIGHT = 66

class Ball:
	def __init__(self, x, y, speed):
		self.default_position = [x, y]
		self.default_velocity = [speed * random.choice([1, -1]), speed * random.choice([1, -1])]

		self.position = [x, y]
		self.velocity = [speed, speed]

	def change_force(self, force):
		if self.velocity[0] < 0:
			self.velocity[0] = -force
		else:
			self.velocity[0] = force

		if self.velocity[1] < 0:
			self.velocity[1] = -force
		else:
			self.velocity[1] = force

	def update(self):
		self.position[0] += self.velocity[0]
		self.position[1] += self.velocity[1]

	def check_collision(self, paddle):
		if self.position[0] + BALL_RADIUS > SCREEN_WIDTH / 5 and self.position[0] - BALL_RADIUS < SCREEN_WIDTH / 5 * 4:
			return False

		if self.position[0] < paddle.position[0] + PADDLE_WIDTH and paddle.position[0] < SCREEN_WIDTH / 2:
			return False
		elif self.position[0] > paddle.position[0] and paddle.position[0] > SCREEN_WIDTH / 2:
			return False

		distX = abs(self.position[0] - paddle.position[0] - PADDLE_WIDTH / 2)
		distY = abs(self.position[1] - paddle.position[1] - PADDLE_HEIGHT / 2)

		if (distX > (PADDLE_WIDTH / 2 + BALL_RADIUS)):
			return False
		elif (distY > (PADDLE_HEIGHT / 2 + BALL_RADIUS)):
			return False
		elif (distX <= (PADDLE_WIDTH / 2)):
			return True
		elif (distY <= (PADDLE_HEIGHT / 2)):
			return True

		dx = distX - PADDLE_WIDTH / 2
		dy = distY - PADDLE_HEIGHT / 2
		return (dx * dx + dy * dy <= (BALL_RADIUS * BALL_RADIUS))

	def reset(self):
		self.position = self.default_position.copy()
		self.velocity = self.default_velocity.copy()
		self.velocity[0] *= random.choice([1, -1])
		self.velocity[1] *= random.choice([1, -1])

class Paddle:
	characters = [
		{
			'force': 4,
			'life': 3,
			'speed': 4,
			'id':0
		},
		{
			'force': 5,
			'life': 2,
			'speed': 5,
			'id':1
		},
		{
			'force': 4,
			'life': 4,
			'speed': 3,
			'id':2
		},
		{
			'force': 6,
			'life': 1,
			'speed': 4,
			'id':3
		},
		{
			'force': 4,
			'life': 1,
			'speed': 4,
			'id':4
		},
		{
			'life': 3,
			'speed': 4,
			'force': 3,
			'id':5
		}
	]
	def __init__(self, x, y, character):
		if int(character) < 0 or int(character) >= len(self.characters):
			self.character = self.characters[0]
		else:
			self.character = self.characters[int(character)]

		self.default_position = [x, y]
		self.default_speed = self.character['speed']
		self.default_force = self.character['force']
		self.life = self.character['life']
		self.moveup = False
		self.movedown = False

		self.position = [x, y]
		self.speed = self.character['speed']
		self.force = self.character['force']

	def move(self):
		if self.moveup:
			self.position[1] -= self.speed
		elif self.movedown:
			self.position[1] += self.speed
		if self.position[1] < 0:
			self.position[1] = 0
		elif self.position[1] + PADDLE_HEIGHT > SCREEN_HEIGHT:
			self.position[1] = SCREEN_HEIGHT - PADDLE_HEIGHT

	def reset(self):
		self.position = self.default_position.copy()
		self.speed = self.default_speed.copy()
		self.force = self.default_force.copy()

class GameThread(threading.Thread):
	def __init__(self, game, group_name, channel_layer):
		super(GameThread, self).__init__(daemon=True, name=f"Game_{group_name}")
		self.game = game
		self.group_name = group_name
		self.channel_layer = channel_layer
		self._stop_event = threading.Event()
		self.loop = asyncio.get_event_loop()

		self.ball = Ball(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 1)
		self.paddle1 = Paddle(5, (SCREEN_HEIGHT - PADDLE_HEIGHT) / 2, self.game.player1_character)
		self.paddle2 = Paddle(SCREEN_WIDTH - PADDLE_WIDTH - 5, (SCREEN_HEIGHT - PADDLE_HEIGHT) / 2, self.game.player2_character)

		self.game.player1_score = self.paddle1.life
		self.game.player2_score = self.paddle2.life

	def __str__(self):
		string = f"{self.group_name} - {self.game.player1} vs {self.game.player2} | score: {self.game.player1_score} - {self.game.player2_score}"
		if self.game.finished:
			string += f" - Winner: {self.game.winner}"
		return string

	def serialize(self):
		return {

			"player1": {
				"x": self.paddle1.position[0],
				"y": self.paddle1.position[1],
				"speed": self.paddle1.speed,
				"score": self.paddle1.life,
				"movedown": self.paddle1.movedown,
				"moveup": self.paddle1.moveup,
				"force": self.paddle1.force,
				"id":self.paddle1.character
			},
			"player2": {
				"x": self.paddle2.position[0],
				"y": self.paddle2.position[1],
				"speed": self.paddle2.speed,
				"score": self.paddle2.life,
				"movedown": self.paddle2.movedown,
				"moveup": self.paddle2.moveup,
				"force": self.paddle2.force,
				"id":self.paddle2.character
			},
			"ball": {
				"x": self.ball.position[0],
				"y": self.ball.position[1],
				"speed_x": self.ball.velocity[0],
				"speed_y": self.ball.velocity[1]
			}
		}

	def run(self):
		asyncio.run_coroutine_threadsafe(
            self.channel_layer.group_send(
				self.group_name,
				{
					'type': 'game.started',
					'message': 'Game has started'
				}
			),
            self.loop
        )
		print("Game started")
		last_time = time.time()
		while not self._stop_event.is_set():
			try :
				current_time = time.time()
				self.delta_time = current_time - last_time
				last_time = current_time

				self.ball.update()
				self.paddle1.move()
				self.paddle2.move()

				if self.ball.position[1] - BALL_RADIUS < 0 or self.ball.position[1] + BALL_RADIUS > SCREEN_HEIGHT:
					self.ball.velocity[1] = -self.ball.velocity[1]
					self.ball.position[1] = max(min(self.ball.position[1], SCREEN_HEIGHT - BALL_RADIUS), BALL_RADIUS)

				if self.ball.check_collision(self.paddle1):
					self.ball.change_force(self.paddle1.force)
					self.ball.velocity[0] = -self.ball.velocity[0]
					self.ball.position[0] = self.paddle1.position[0] + PADDLE_WIDTH + BALL_RADIUS

					paddleCenterY = self.paddle1.position[1] + PADDLE_HEIGHT / 2
					impactY = self.ball.position[1] - paddleCenterY
					impactRatio = impactY / (PADDLE_HEIGHT / 2)

					self.ball.velocity[1] = impactRatio * self.ball.velocity[1]


				if self.ball.check_collision(self.paddle2):
					self.ball.change_force(self.paddle2.force)
					self.ball.velocity[0] = -self.ball.velocity[0]
					self.ball.position[0] = self.paddle2.position[0] - BALL_RADIUS

					paddleCenterY = self.paddle2.position[1] + PADDLE_HEIGHT / 2
					impactY = self.ball.position[1] - paddleCenterY
					impactRatio = impactY / (PADDLE_HEIGHT / 2)

					self.ball.velocity[1] = impactRatio * self.ball.velocity[1]

				if self.ball.position[0] - BALL_RADIUS < 0 :
					self.paddle1.life -= 1
					self.ball.reset()

				if self.ball.position[0] + BALL_RADIUS > SCREEN_WIDTH:
					self.paddle2.life -= 1
					self.ball.reset()

				if self.paddle1.life <= 0:
					self.game_over(self.game.player2)
				elif self.paddle2.life <= 0:
					self.game_over(self.game.player1)
				else :
					asyncio.run_coroutine_threadsafe(
                        self.channel_layer.group_send(
                            self.group_name,
                            {
                                'type': 'game.update',
                                'message': self.serialize()
                            }
                        ),
                        self.loop
                    )

				self.game.save()

				time.sleep(max(1.0 / 60 - self.delta_time, 0))
			except Exception as e:
				print(e)
				asyncio.run_coroutine_threadsafe(
                    self.channel_layer.group_send(
                        self.group_name,
                        {
                            'type': 'game.error',
                            'message': 'Fatal Error in Game'
                        }
                    ),
                    self.loop
                )
				break

	def game_over(self, Winner):
		self.game.finished = True
		self.game.winner = Winner
		if self.game.player1 == Winner:
			self.game.player1.wins += 1
			self.game.player2.looses += 1
		else:
			self.game.player2.wins += 1
			self.game.player1.looses += 1
		self.game.save()
		self.game.player1.save()
		self.game.player2.save()
		self.game.winner.save()
		print("game_over")
		self._stop_event.set()

		asyncio.run_coroutine_threadsafe(
            self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'game.update',
                    'message': self.serialize()
                }
            ),
            self.loop
        )

		asyncio.run_coroutine_threadsafe(
            self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'game.end',
                    'message': 'Game has ended',
                    'winner': Winner.id
                }
            ),
            self.loop
        )

	async def set_player_direction(self, player, data):
		if player == "player1":
			if data["direction"] == "up":
				self.paddle1.moveup = data["message"] == "keydown"
			else:
				self.paddle1.movedown = data["message"] == "keydown"
		else:
			if data["direction"] == "up":
				self.paddle2.moveup= data["message"] == "keydown"
			else:
				self.paddle2.movedown = data["message"] == "keydown"

	async def stop(self, user):
		user2 = self.game.player2 if user == self.game.player1 else self.game.player1
		await sync_to_async(self.game_over)(user2)