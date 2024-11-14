class PongGame {
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;

        this.counter = 3;
        this.PlayerLife = 3;

        this.gameCanvas = document.getElementById("game-layer");
        this.ctx = this.gameCanvas.getContext("2d");

        this.uiCanvas = document.getElementById("ui-layer");
        this.uiCtx = this.uiCanvas.getContext("2d");

        this.bgCanvas = document.getElementById("background-layer");
        this.bgCtx = this.bgCanvas.getContext('2d');

        this.background = new Image();
        this.background.src = 'floor.png';

        this.pong = {
            isRunning: false,
            leftPlayerScore: this.PlayerLife,
            rightPlayerScore: this.PlayerLife,
            ball: null,
            leftPaddle: null,
            rightPaddle: null,
            border: null,
        };

        this.loop = null;

        this.keys = [];
    }

    startCountdown() {
        this.counter = 3;
        const countdownTimer = setInterval(() => {
            this.counter--;
            if (this.counter < 0) {
                clearInterval(countdownTimer);
            }
        }, 1000);
    }

    updateScoreboard() {
        this.uiCtx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        this.uiCtx.font = '3vw arial';
        this.uiCtx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        this.uiCtx.textAlign = 'left';
        this.uiCtx.textBaseline = 'middle';
        let heartsLeft = '♥'.repeat(this.pong.leftPlayerScore);
        this.uiCtx.fillText(heartsLeft, 8, 25);

        this.uiCtx.font = '3vw arial';
        this.uiCtx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        this.uiCtx.textAlign = 'right';
        this.uiCtx.textBaseline = 'middle';
        let hearts = '♥'.repeat(this.pong.rightPlayerScore);
        this.uiCtx.fillText(hearts, 1080, 25);
    }

    gameStart() {
        this.bgCtx.fillStyle = "blue";
        this.bgCtx.fill();
        this.initializeGame();
        this.updateScoreboard();
        this.manageAddEvent();
        this.ctx.font = '3vw Arial';
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText('Press \'spacebar\' to start', this.gameCanvas.width / 2, this.gameCanvas.height / 2 + 150);
    }

    manageAddEvent() {
        window.addEventListener('keydown', function(e) {
            this.keys = (this.keys || []);
            this.keys[e.key] = true;
        });
        window.addEventListener('keyup', function(e) {
            this.keys[e.key] = false;
        });
    
        window.addEventListener('keydown', function(e) {
            if (e.code === "Space" && !this.isRunning) {
                this.isRunning = true; 
                this.startGameLoop();
            }
            if (e.code === "Enter") {
                this.newGame();
                this.startGameLoop();
            }
        });
    }

    initializeGame() {
        this.pong.ball = new Ball(this.gameCanvas.width / 2, this.gameCanvas.height / 2);
        this.pong.leftPaddle = new Paddle(120, this.gameCanvas.height / 2 - 30, "w", "s");
        this.pong.rightPaddle = new Paddle(this.gameCanvas.width - 130, this.gameCanvas.height / 2 - 30, "ArrowUp", "ArrowDown");
        this.pong.border = new Border(110, 110, 880, 480);
        this.render();
    }

    startGameLoop() {
        this.stop();
        this.startCountdown();
        this.loop = requestAnimationFrame(this.updateGame.bind(this));
    }

    clear() {
        this.ctx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
    }

    stop() {
        if (this.loop !== null) {
            console.log("Stopping animation loop");
            cancelAnimationFrame(this.loop);
            this.loop = null;
        }
    }

    gameOver(loser) {
        this.ctx.font = '7vw Arial';
        this.ctx.fillStyle = 'rgba(1, 130, 0, 1)';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText(loser + ' win', this.gameCanvas.width / 2, this.gameCanvas.height / 2);

        this.ctx.font = '3vw Arial';
        this.ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText('Press \'enter\' to restart', this.gameCanvas.width / 2, this.gameCanvas.height / 2 + 150);
        this.stop();
        // this.initializeGame();
        this.clear();
    }

    newRound() {
        this.pong.isRunning = true;
        this.counter = 3;
        this.clear();
        this.stop();
        this.updateScoreboard();
        this.initializeGame();
        this.startCountdown();
    }

    newGame() {
        this.pong.rightPlayerScore = this.PlayerLife;
        this.pong.leftPlayerScore = this.PlayerLife;
        this.newRound();
    }

    updateGame() {
        if (!this.pong.isRunning) return;

        this.clear();
        if (this.pong.rightPlayerScore == 0) {
            this.gameOver("left");
            return;
        }
        if (this.pong.leftPlayerScore == 0) {
            this.gameOver("right");
            return;
        }

        if (this.counter >= 0 && this.pong.rightPlayerScore && this.pong.leftPlayerScore) {
            this.ctx.font = '10vw Arial';
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(this.counter === 0 ? 'GO' : this.counter, this.gameCanvas.width / 2, this.gameCanvas.height / 2);
        } else {
            this.pong.ball.x += this.pong.ball.vx;
            this.pong.ball.y += this.pong.ball.vy;
        }
        this.pong.leftPaddle.move();
        this.pong.rightPaddle.move();

        this.pong.leftPaddle.newPos();
        this.pong.rightPaddle.newPos();

        this.ballImpact(this.pong.ball, [this.pong.leftPaddle, this.pong.rightPaddle], this.pong.border);
        this.render();
        this.loop = requestAnimationFrame(this.updateGame.bind(this));
    }

    ballImpact(ball, paddles, border) {
        // Impact top bottom 
        if (ball.y > this.gameCanvas.height - border.y - ball.radius || ball.y < border.y + ball.radius) {
            ball.vy = -ball.vy;
        }

        for (let paddle of paddles) {
            if (RectCircleColliding(ball, paddle)) {
                ball.vx = -ball.vx;

                let paddleCenterY = paddle.y + Math.abs(paddle.height / 2);
                let impactY = ball.y - paddleCenterY;
                let impactRatio = impactY / Math.abs(paddle.height / 2);

                ball.vy = impactRatio * 4;

                this.pong.ball.color = "red";

                break;
            } else {
                this.pong.ball.color = "skyblue";
            }
        }

        if (ball.x > this.gameCanvas.width - border.x - ball.radius) {
            this.pong.rightPlayerScore--;
            this.updateScoreboard();
            this.newRound();
        } else if (ball.x < ball.radius + border.x) {
            this.pong.leftPlayerScore--;
            this.updateScoreboard();
            this.newRound();
        }
    }

    render() {
        this.pong.leftPaddle.render();
        this.pong.rightPaddle.render();
        this.pong.ball.render();
        this.pong.border.render();
    }
}

class Paddle {
    constructor(x, y, upKey, downKey, pongGame) {
        this.width = 10;
        this.height = 60;
        this.color = "red";
        this.speedY = 0;
        this.x = x;
        this.y = y;
        this.upKey = upKey;
        this.downKey = downKey;

        this.pongGame = pongGame;
    }

    move(keys) {
        this.speedY = 0;
        if (keys && keys[this.upKey] && this.y > pong.border.y + 2) { this.speedY = -8; }
        if (keys && keys[this.downKey] && this.y < gameCanvas.height - pong.border.y - this.height - 2) { this.speedY = 8; }
    }

    newPos() {
        this.y += this.speedY;
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > gameCanvas.height) this.y = gameCanvas.height - this.height;
    }

    render() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 5;
        this.vy = 0;
        this.radius = 15;
        this.color = "skyblue";
    }

    render() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class Border {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = "black";
    }

    render() {
        ctx.lineWidth = 2
        ctx.strokeRect(this.x, this.y, this.w, this.h);
    }
}

function RectCircleColliding(circle, rect) {
    var distX = Math.abs(circle.x - rect.x - rect.width / 2);
    var distY = Math.abs(circle.y - rect.y - rect.height / 2);

    if (distX > Math.abs(rect.width / 2 + circle.radius)) {
        return false;
    }
    if (distY > Math.abs(rect.height / 2 + circle.radius)) {
        return false;
    }
    
    if (distX <= Math.abs(rect.width / 2)) {
        return true;
    }
    if (distY <= Math.abs(rect.height / 2)) {
        return true;
    }

    var dx = distX - Math.abs(rect.width / 2);
    var dy = distY - Math.abs(rect.height / 2);
    return (dx * dx + dy * dy <= (circle.radius * circle.radius));
}

// Initialize and start the game
const pongGame = new PongGame("gabriel", "bot");
pongGame.gameStart();