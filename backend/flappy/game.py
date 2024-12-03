import threading
import time
import random
import queue
from asgiref.sync import async_to_sync

GRAVITY = 0.2
JUMP_STRENGTH = -5.5
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
			'force': 4,
			'life': 3,
			'speed': 4
		},
		{
			'force': 5,
			'life': 2,
			'speed': 5
		},
		{
			'force': 4,
			'life': 4,
			'speed': 3
		},
		{
			'force': 6,
			'life': 1,
			'speed': 4
		},
		{
			'force': 4,
			'life': 1,
			'speed': 4
		},
		{
			'life': 3,
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
		self.x -= 3 + game_speed

class GameThread(threading.Thread):
	def __init__(self, game, group_name, channel_layer):
		super(GameThread, self).__init__(daemon=True, name=f"Game_{group_name}")
		self.game = game
		self.group_name = group_name
		self.channel_layer = channel_layer
		self._stop_event = threading.Event()

		self.player1 = Player(self.game.player1_character)
		self.player2 = Player(self.game.player2_character)

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

				if self.obstacles.empty() or self.obstacles.queue[-1].x < WIDTH - OBSTACLE_SPACING:
					self.obstacles.put(Obstacle(WIDTH))

				self.player1.update()
				self.player2.update()

				for obstacle in list(self.obstacles.queue):
					obstacle.update(self.game_speed)
					if obstacle.x < -OBSTACLE_WIDTH:
						self.obstacles.get()
						self.game.player1_score += 1
						self.game.player2_score += 1
						self.game_speed += 0.1
					elif self.player1.collide(obstacle):
						self.game_over(self.game.player2)
						break
					elif self.player2.collide(obstacle):
						self.game_over(self.game.player1)
						break

				async_to_sync(self.channel_layer.group_send)(
					self.group_name,
					{
						'type': 'game.update',
						'message': self.serialize()
					}
				)

				self.game.save()

				time.sleep(max(1.0 / 60 - self.delta_time, 0))
			except Exception as e:
				print(e)
				async_to_sync(self.channel_layer.group_send)(
					self.group_name,
					{
						'type': 'game.error',
						'message': 'Fatal Error in Game'
					}
				)
				break

	def game_over(self, Winner):
		self.game.finished = True
		self.game.winner = Winner
		if self.game.player1_score > self.game.player1.best_score:
			self.game.player1.best_score = self.game.player1_score
		if self.game.player2_score > self.game.player2.best_score:
			self.game.player2.best_score = self.game.player2_score
		self.game.player1.save()
		self.game.player2.save()
		self.game.save()
		self.game.winner.save()
		self._stop_event.set()

		async_to_sync(self.channel_layer.group_send)(
			self.group_name,
			{
				'type': 'game.update',
				'message': self.serialize()
			}
		)

		async_to_sync(self.channel_layer.group_send)(
			self.group_name,
			{
				'type': 'game.end',
				'message': 'Game has ended',
				'winner': Winner.id
			}
		)

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
