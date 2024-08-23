import { Component } from "../Component.js";

export default class Pong extends Component {
	constructor() {
		super();
		console.log("Pong class");
	}

	async getCSS()
	{
		const css = `
        <style>
			body, html {
				height: 100%;
				margin: 0;
				display: flex;
				justify-content: center;
				align-items: center;
				/* background-color: black;  */
			}

			#container {
				display: flex;
				flex-direction: column;
				align-items: center;
			}

			#canvas {
				border: 1px solid black; /* Optional: Border around the canvas */
			}
		</style>`;
		return css;
	}



	
	async getHtml() {
		return ` 
		<div id="container">
			<div id="scoreboard"> </div>
			<canvas id="canvas" width=1100 height=700 0></canvas>
		</div>
		` + await this.getCSS();
	}

	getScript()
	{
		const js = `
		var counter = 3;
		var PlayerLife = 1;

		var canvas = document.getElementById("canvas");
		var ctx = canvas.getContext("2d");

		/*gestion image & background */

		// const background = new Image();
		// background.src = '../assets/images/floor.png';
		// let offscreenCanvas = document.createElement('canvas');
		// let offscreenCtx = offscreenCanvas.getContext('2d');
		// offscreenCanvas.width = canvas.width;
		// offscreenCanvas.height = canvas.height;
		// offscreenCtx.drawImage(background, 0, 0, canvas.width, canvas.height);

		let pong = {
			isRunning: false,
			leftPlayerScore: PlayerLife,
			rightPlayerScore: PlayerLife,
			ball: null,
			leftPaddle: null,
			rightPaddle: null,
			border: null,
		};

		function gameStart() {
			initializeGame();
			updateScoreboard();
			manageAddEvent();
			ctx.font = '3vw Arial';
			ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'bottom';
			ctx.fillText('Press \'spacebar\' to start', canvas.width / 2, canvas.height / 2 + 150);
		}

		function manageAddEvent()
		{
			//reactivité des touches
			window.addEventListener('keydown', function(e) {
				pongGame.keys = (pongGame.keys || []);
				pongGame.keys[e.key] = true;
			});
			window.addEventListener('keyup', function(e) {
				pongGame.keys[e.key] = false;
			});

			window.addEventListener('keydown', function(e) {
				if (e.code === "Space" && !pong.isRunning) {
					pong.isRunning = true; 
					pongGame.startGameLoop();
				}
				if (e.code === "Enter") {
					pongGame.newGame();
					pongGame.startGameLoop();
				}
			});  
		}

		function initializeGame() {
			// ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
			pong.ball = new Ball(canvas.width/2, canvas.height/2)
			pong.leftPaddle = new Paddle(120, canvas.height/2 - 30, "w", "s");
			pong.rightPaddle = new Paddle(canvas.width - 130, canvas.height/2 - 30, "ArrowUp", "ArrowDown");
			pong.border = new Border(110, 110, 880, 480);
			render();
		}

		var pongGame = {
			loop: null,

			startGameLoop: function() {
				this.stop();
				startCountdown();
				this.loop = requestAnimationFrame(this.updateGame.bind(this));
			},
			clear: function() {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			},
			stop: function() {
				if (this.loop !== null) {
					console.log("Stopping animation loop");
					cancelAnimationFrame(this.loop);
					this.loop = null;
				}
			},
			gameOver: function(loser) {
				ctx.font = '7vw Arial';
				ctx.fillStyle = 'rgba(1, 130, 0, 0.5)';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'bottom';
				ctx.fillText(loser + ' win', canvas.width / 2, canvas.height / 2);

				ctx.font = '3vw Arial';
				ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'bottom';
				ctx.fillText('Press \'enter\' to restart', canvas.width / 2, canvas.height / 2 + 150);
				this.stop();
				initializeGame();
			},
			newRound: function() {
				pong.isRunning = true;
				counter = 3;
				this.clear();
				this.stop();
				updateScoreboard();
				initializeGame();
				startCountdown();
				
			},
			newGame: function() {
				pong.rightPlayerScore = PlayerLife;
				pong.leftPlayerScore = PlayerLife;
				this.newRound();
			},
			updateGame: function() {
				if (!pong.isRunning) return;

				this.clear();
				// ctx.drawImage(offscreenCanvas, 0, 0);
			
				if (pong.rightPlayerScore == 0) {
					this.gameOver("left");
					return;
				}
				if (pong.leftPlayerScore == 0) {
					this.gameOver("right");
					return;
				}
			
				if (counter >= 0 && pong.rightPlayerScore && pong.leftPlayerScore) {
					ctx.font = '10vw Arial';
					ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillText(counter === 0 ? 'GO' : counter, canvas.width / 2, canvas.height / 2);
				}
				else {    
					pong.ball.x += pong.ball.vx;
					pong.ball.y += pong.ball.vy;
				}   
					pong.leftPaddle.move();
					pong.rightPaddle.move();
			
					pong.leftPaddle.newPos();
					pong.rightPaddle.newPos();
			
			
			
					ballImpact(pong.ball, [pong.leftPaddle, pong.rightPaddle], pong.border);
				render();
				updateScoreboard();
			
				this.loop = requestAnimationFrame(this.updateGame.bind(this));
			}
		}

		function Paddle(x, y, upKey, downKey) {
			this.width = 10;
			this.height = 60;
			this.color = "black";
			this.speedY = 0;
			this.x = x;
			this.y = y;
			this.upKey = upKey;
			this.downKey = downKey;

			this.render = function() {
				ctx.fillStyle = this.color;
				ctx.fillRect(this.x, this.y, this.width, this.height);
			}

			this.newPos = function() {
				this.y += this.speedY;
				if (this.y < 0) this.y = 0;
				if (this.y + this.height > canvas.height) this.y = canvas.height - this.height;
			}

			this.move = function() {
				this.speedY = 0;
				if (pongGame.keys && pongGame.keys[this.upKey] && this.y > pong.border.y + 2) { this.speedY = -8; }
				if (pongGame.keys && pongGame.keys[this.downKey] && this.y < canvas.height - pong.border.y - this.height - 2) { this.speedY = 8; }
			}
		}

		function Ball(x, y) {
			this.x = x;
			this.y = y;
			this.vx = 5;
			this.vy = 0;
			this.radius = 15;
			this.color = "skyblue";

			this.render = function() {  
				ctx.beginPath();
				ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
				ctx.closePath();
				ctx.fillStyle = this.color;
				ctx.fill();
			}
		}

		function Border(x, y, w, h) {
			this.x = x;
			this.y = y;
			this.w = w;
			this.h = h;
			this.color = "black";
			this.render = function() {
				ctx.lineWidth = 2
				ctx.strokeRect(this.x, this.y, this.w, this.h);
			}

		}

		function RectCircleColliding(circle, rect) {
			var distX = Math.abs(circle.x - rect.x - rect.width / 2);
			var distY = Math.abs(circle.y - rect.y - rect.height / 2);

			if (distX > (rect.width / 2 + circle.radius)) {
				return false;
			}
			if (distY > (rect.height / 2 + circle.radius)) {
				return false;
			}
			
			if (distX <= (rect.width / 2)) {
				return true;
			}
			if (distY <= (rect.height / 2)) {
				return true;
			}

			var dx = distX - rect.width / 2;
			var dy = distY - rect.height / 2;
			return (dx * dx + dy * dy <= (circle.radius * circle.radius));
		}

		function ballImpact(ball, paddles, border) {
			// Impact top bottom 
			if (ball.y > canvas.height - border.y - ball.radius || ball.y < border.y + ball.radius) {
				ball.vy = -ball.vy;
			}

			for (let paddle of paddles) {
				if (RectCircleColliding(ball, paddle)) {
					ball.vx = -ball.vx;

					let paddleCenterY = paddle.y + paddle.height / 2;
					let impactY = ball.y - paddleCenterY;
					let impactRatio = impactY / (paddle.height / 2);

					ball.vy = impactRatio * 4; 
					
					pong.ball.color = "red";
					
					break; 
				} else {
					pong.ball.color = "skyblue";
				}
			}

			if (ball.x > canvas.width - border.x - ball.radius) {
				pong.rightPlayerScore--;
				updateScoreboard(); 
				pongGame.newRound();
			} else if (ball.x < ball.radius + border.x) {
				pong.leftPlayerScore--;
				updateScoreboard();
				pongGame.newRound();
			}
		}

		function render()
		{
			pong.leftPaddle.render();
			pong.rightPaddle.render();
			pong.ball.render();
			pong.border.render();
			updateScoreboard();
		}

		function startCountdown() {
			counter = 3;
			var countdownTimer = setInterval(function() {
				counter--;
				if (counter < 0) {
					clearInterval(countdownTimer);
				}
			}, 1000);

		}

		function updateScoreboard() {
			ctx.font = '3vw arial';
			ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
			ctx.textAlign = 'left';
			ctx.textBaseline = 'middle';
			let heartsLeft = '♥'.repeat(pong.leftPlayerScore);
			ctx.fillText(heartsLeft, 8, 25);

			ctx.font = '3vw arial';
			ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
			ctx.textAlign = 'right';
			ctx.textBaseline = 'middle';
			let hearts = '♥'.repeat(pong.rightPlayerScore);
			ctx.fillText(hearts, 1080, 25);
		}

		gameStart();
		`
		return js;	
	}
}