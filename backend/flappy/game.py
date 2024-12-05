import threading
import time
import random
import queue
import asyncio

GRAVITY = 0.18
JUMP_STRENGTH = -6
OBSTACLE_WIDTH = 60
HOLE_HEIGHT = 200
OBSTACLE_SPACING = 300
HOLE_MIN_HEIGHT = 100
HOLE_MAX_HEIGHT = 400
HEIGHT = 600
WIDTH = 800

class Player:
	characters = [
		{
			'force': 5,
			'life': 3,
			'speed': 4
		},
		{
			'force': 6,
			'life': 2,
			'speed': 5
		},
		{
			'force': 5,
			'life': 4,
			'speed': 3
		},
		{
			'force': 7,
			'life': 1,
			'speed': 4
		},
		{
			'force': 5,
			'life': 1,
			'speed': 4
		},
		{
			'life': 4,
			'speed': 4,
			'force': 3
		}
	]
	def __init__(self, character):
		self.character = self.characters[int(character)]

		self.position = [100, HEIGHT / 2]
		self.velocity = 0

		self.width = 36
		self.height = 42

		self.can_jump = True

	def	jump(self):
		self.velocity = JUMP_STRENGTH
		self.can_jump = False

	def update(self):
		self.velocity += GRAVITY
		self.position[1] += self.velocity

		if self.position[1] < 0:
			self.position[1] = 0

	def collide(self, obstacle):
		topObstacleHeight = obstacle.holeY
		bottomObstacleY = obstacle.holeY + HOLE_HEIGHT

		test1 = self.position[0] < obstacle.x + OBSTACLE_WIDTH
		test2 = self.position[0] + self.width > obstacle.x
		test3 = self.position[1] < topObstacleHeight or self.position[1] + self.height > bottomObstacleY
		test4 = self.position[1] >= HEIGHT

		return test1 and test2 and test3 or test4
	
class Obstacle:
	def __init__(self, x):
		self.x = x
		self.holeY =  HOLE_MIN_HEIGHT + random.random() * (HOLE_MAX_HEIGHT - HOLE_MIN_HEIGHT)

	def update(self, game_speed):
		self.x -= 2.5 + game_speed

class GameThread(threading.Thread):
	def __init__(self, game, group_name, channel_layer):
		super(GameThread, self).__init__(daemon=True, name=f"Game_{group_name}")
		self.game = game
		self.group_name = group_name
		self.channel_layer = channel_layer
		self._stop_event = threading.Event()
		self.loop = asyncio.get_event_loop()

		self.player1 = Player(self.game.player1_character)
		self.player2 = Player(self.game.player2_character)

		self.player1_loose = False
		self.player2_loose = False

		self.game_speed = 0

		self.obstacles = queue.Queue()

	def __str__(self):
		string = f"{self.group_name} - {self.game.player1} vs {self.game.player2} | score: {self.game.player1_score} - {self.game.player2_score}"
		if self.game.finished:
			string += f" - Winner: {self.game.winner}"
		return string

	def serialize(self):
		obstacles = []
		for obstacle in list(self.obstacles.queue):
			obstacles.append({
				"x": obstacle.x,
				"holeY": obstacle.holeY
			})

		return {
			"player1": {
				"y": self.player1.position[1],
				"score": self.game.player1_score
			},
			"player2": {
				"y": self.player2.position[1],
				"score": self.game.player2_score
			},
			"obstacles": obstacles,
			"game_speed": self.game_speed
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

				if self.obstacles.empty() or self.obstacles.queue[-1].x < WIDTH - OBSTACLE_SPACING:
					self.obstacles.put(Obstacle(WIDTH))

				if not self.player1_loose:
					self.player1.update()
				if not self.player2_loose:
					self.player2.update()

				for obstacle in list(self.obstacles.queue):
					obstacle.update(self.game_speed)
					if obstacle.x < -OBSTACLE_WIDTH:
						self.obstacles.get()
						if not self.player1_loose: self.game.player1_score += 1
						if not self.player2_loose: self.game.player2_score += 1
						self.game_speed += 0.1
					elif not self.player1_loose and self.player1.collide(obstacle):
						self.player1_loose = True
						self.game_over(self.game.player2)
					elif not self.player2_loose and self.player2.collide(obstacle):
						self.player2_loose = True
						self.game_over(self.game.player1)

				if self.player1_loose and self.player2_loose:
					self.game_end()

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

	def game_end(self):
		if self.game.player1_score > self.game.player1.best_score:
			self.game.player1.best_score = self.game.player1_score
			print("player1 best score", self.game.player1.best_score, self.game.player1_score)
		if self.game.player2_score > self.game.player2.best_score:
			self.game.player2.best_score = self.game.player2_score
			print("player2 best score", self.game.player2.best_score, self.game.player2_score)
		self.game.player1.save()
		self.game.player2.save()
		self.game.save()
		self.game.winner.save()
		self._stop_event.set()

		asyncio.run_coroutine_threadsafe(
			self.channel_layer.group_send(
				self.group_name,
				{
					'type': 'game.end',
					'message': 'Game has ended',
					'winner': self.game.winner.id
				}
			),
			self.loop
		)

	def game_over(self, Winner):
		if self.game.finished:
			return
		print("game_over")
		self.game.finished = True
		self.game.winner = Winner
		self.game.save()

		asyncio.run_coroutine_threadsafe(
            self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'game.looser',
                    'message': 'Game has ended',
                    'winner': Winner.id
                }
            ),
            self.loop
        )

	async def left(self, player):
		if self.player1_loose and self.player2_loose:
			return True
		if self.player1 == player and not self.player1_loose:
			self.player1_loose = True
			self.game_over(self.game.player2)
			return False
		elif self.player2 == player and not self.player2_loose:
			self.player2_loose = True
			self.game_over(self.game.player1)
			return False

	async def set_player_jump(self, player, data):
		player_jump = self.player1 if player == "player1" else self.player2

		if data['pressed'] and player_jump.can_jump:
			player_jump.jump()
		elif not data['pressed']:
			player_jump.can_jump = True

	def stop(self, user):
		print("Game stopped")
		user2 = self.game.player2 if user == self.game.player1 else self.game.player1
		self.game.finished = True
		self.game.winner = user2
		if self.game.player1_score > self.game.player1.best_score:
			self.game.player1.best_score = self.game.player1_score
		if self.game.player2_score > self.game.player2.best_score:
			self.game.player2.best_score = self.game.player2_score
		self.game.player1.save()
		self.game.player2.save()
		self.game.save()
		self._stop_event.set()