export var leftPaddle;
export var rightPaddle;
export var BallVar;
export var isPlaying = false;

console.log("Hello from script.js!");

export function startGame() {
  myGameArea.start();
  leftPaddle = new Paddle(30, 105, "w", "s");
  rightPaddle = new Paddle(440, 105, "ArrowUp", "ArrowDown");
  BallVar = new Ball();
  window.addEventListener('keydown', function (e) {
    if (e.code === "Space" && !isPlaying) {
      isPlaying = true;
      myGameArea.startGameLoop();
    }
  });
}

export var myGameArea = {
  canvas: document.getElementById("gameCanvas"),
  start: function () {
    window.addEventListener('keydown', function (e) {
      myGameArea.keys = (myGameArea.keys || []);
      myGameArea.keys[e.key] = true;
    });
    window.addEventListener('keyup', function (e) {
      myGameArea.keys[e.key] = false;
    });
    this.canvas.width = 480;
    this.canvas.height = 270;
    this.context = this.canvas.getContext("2d");
  },
  startGameLoop: function () {
    this.interval = setInterval(updateGameArea, 20);
  },
  clear: function () {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

export function Paddle(x, y, upKey, downKey) {
  this.width = 10;
  this.height = 60;
  this.color = "black";
  this.speedY = 0;
  this.x = x;
  this.y = y;
  this.upKey = upKey;
  this.downKey = downKey;

  this.update = function () {
    const ctx = myGameArea.context; // Define ctx within the method
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  this.newPos = function () {
    this.y += this.speedY;
    if (this.y < 0) this.y = 0;
    if (this.y + this.height > myGameArea.canvas.height) this.y = myGameArea.canvas.height - this.height;
  }

  this.move = function () {
    this.speedY = 0;
    if (myGameArea.keys && myGameArea.keys[this.upKey]) { this.speedY = -4; }
    if (myGameArea.keys && myGameArea.keys[this.downKey]) { this.speedY = 4; }
  }
}

export function ballImpact(ball, paddles) {
  // Impact with top and bottom walls
  const nextX = ball.x + ball.vx;
  const nextY = ball.y + ball.vy;
  if (nextY > myGameArea.canvas.height - ball.radius || nextY < ball.radius) {
    ball.vy = -ball.vy;
  }

  // Impact with paddles front
  paddles.forEach(function (paddle) {
    if (nextX < paddle.x + paddle.width + ball.radius &&
      nextX > paddle.x - ball.radius &&
      nextY > paddle.y &&
      nextY < paddle.y + paddle.height) {
      ball.vx = -ball.vx;
    }
    // Impact with paddles corner
    var distX = Math.abs(nextX - paddle.x - paddle.width / 2);
    var distY = Math.abs(nextY - paddle.y - paddle.height / 2);
    var dx = distX - paddle.width / 2;
    var dy = distY - paddle.height / 2;
    if (dx * dx + dy * dy <= (ball.radius * ball.radius)) {
      ball.vx = -ball.vx;
    }
  });

  // Impact with left and right walls
  if (nextX > myGameArea.canvas.width - ball.radius || nextX < ball.radius) {
    ball.vx = -ball.vx;
  }
}

export function Ball() {
  this.x = 100;
  this.y = 100;
  this.vx = 5;
  this.vy = 5;
  this.radius = 15;
  this.color = "blue";
  this.update = function () {
    const ctx = myGameArea.context; // Define ctx within the method
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

export function updateGameArea() {
  myGameArea.clear();

  // Move and update paddles
  leftPaddle.move();
  rightPaddle.move();

  leftPaddle.newPos();
  rightPaddle.newPos();
  BallVar.x += BallVar.vx;
  BallVar.y += BallVar.vy;
  ballImpact(BallVar, [leftPaddle, rightPaddle]);

  leftPaddle.update();
  rightPaddle.update();
  BallVar.update();
}

startGame();
