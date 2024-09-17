import threading

class Game(threading.Thread):
	def __init__(self, game, group_name):
		super(Game, self).__init__(daemon=True, name=f"Game_{group_name}")
		self.game = game
		self.group_name = group_name
		self.canvas_width = 800
		self.canvas_height = 400
		self.paddleWidth = 10
		self.paddleHeight = 75
		self.ballRadius = 8

	def __str__(self):
		string = f"{self.room_name} - {self.player1_id} vs {self.player2_id} | score: {self.player1_score} - {self.player2_score}"
		if self.finished:
			string += f" - Winner: {self.winner_id}"
		return string

	def run(self):
		pass
