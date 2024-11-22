import { customalert } from "../../../../components/alert/script.js";
import { router } from '../../../../app.js';

const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");

const paddleWidth = 10;
const paddleHeight = 75;
const ballRadius = 8;

let paddle1Y;
let paddle2X;
let paddle3X;
let paddle4Y;
let ballX;
let ballY;
let ballspeedX;
let ballspeedY;
let player1moveup;
let player1movedown;
let player2moveleft;
let player2moveright;
let player3moveright;
let player3moveleft;
let player4moveup;
let player4movedown;
let player1Score;
let player2Score;
let player3Score;
let player4Score;
let lastTouch;

let player1;
let player2;
let player3;
let player4;
let game_started;
let game_ended;

function handleKeydown(e) {
	if (!game_started)
		return;

	if (e.key === 'ArrowLeft') {
		player3moveleft = true;
	} else if (e.key === 'ArrowRight') {
		player3moveright = true;
	}

    if (e.key === 'w') {
		player1moveup = true;
	} else if (e.key ==='s') {
		player1movedown = true;
	}

    if (e.key === 'j') {
        player2moveleft = true;
    } else if (e.key === 'k') {
        player2moveright = true;
    }

    if (e.key === '8') {
        player4moveup = true;
    } else if (e.key === '5') {
        player4movedown = true;
    }
}

function handleKeyup(e) {
	if (!game_started)
		return;

	if (e.key === 'ArrowLeft') {
		player3moveleft = false;
	} else if (e.key === 'ArrowRight') {
		player3moveright = false;
	}

    if (e.key === 'w') {
		player1moveup = false;
	} else if (e.key ==='s') {
		player1movedown = false;
	}

    if (e.key === 'j') {
        player2moveleft = false;
    } else if (e.key === 'k') {
        player2moveright = false;
    }

    if (e.key === '8') {
        player4moveup = false;
    } else if (e.key === '5') {
        player4movedown = false;
    }
}

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = 'black';
	ctx.fillRect(5, paddle1Y, paddleWidth, paddleHeight);
	ctx.fillRect(paddle2X, 5, paddleHeight, paddleWidth);
	ctx.fillRect(paddle3X, canvas.height - paddleWidth - 5, paddleHeight, paddleWidth);
	ctx.fillRect(canvas.height - paddleWidth - 5, paddle4Y, paddleWidth, paddleHeight);

	ctx.beginPath();
	ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
	ctx.fillStyle = 'red';
	ctx.fill();
	ctx.closePath();

	ctx.font = '20px Arial';
	ctx.fillText(`${player1}: ${player1Score}`, 20, 20);
	ctx.fillText(`${player2}: ${player2Score}`, canvas.width - 200, 20);
	ctx.fillText(`${player3}: ${player3Score}`, 20, 40);
	ctx.fillText(`${player4}: ${player4Score}`, canvas.width - 200, 40);
}

function ballReset() {
	ballX = canvas.width / 2;
	ballY = canvas.height / 2;
	let randomNumber1 = Math.floor(Math.random() * 5);

	if (randomNumber1 === 0) {
		ballspeedX = 4;
		ballspeedY = 0.1;
	}
	if (randomNumber1 === 1) {
		ballspeedX = -4;
		ballspeedY = 0.1;
	}
	if (randomNumber1 === 2) {
		ballspeedX = 0.1;
		ballspeedY = 4;
	}
	if (randomNumber1 === 3) {
		ballspeedX = 0.1;
		ballspeedY = -4;
	}
}

function updateScore() {
	if (lastTouch == null)
		return;

	if (lastTouch == player1) {
		player1Score++;
	} else if (lastTouch == player2) {
		player2Score++;
	} else if (lastTouch == player3) {
		player3Score++;
	} else if (lastTouch == player4) {
		player4Score++;
	}

	if (player1Score >= 5 || player2Score >= 5 || player3Score >= 5 || player4Score >= 5) {
		game_ended = true;
		customalert('Game Over', lastTouch + ' wins!');
	}

	lastTouch = null;
}

function RectCircleColliding(circle_x, circle_y, rect_x, rect_y, rect_width, rect_height) {
	var distX = Math.abs(circle_x - rect_x - rect_width / 2);
	var distY = Math.abs(circle_y - rect_y - rect_height / 2);

	if (distX > (rect_width / 2 + ballRadius)) {
		return false;
	}
	if (distY > (rect_height / 2 + ballRadius)) {
		return false;
	}
	
	if (distX <= (rect_width / 2)) {
		return true;
	}
	if (distY <= (rect_height / 2)) {
		return true;
	}

	var dx = distX - rect_width / 2;
	var dy = distY - rect_height / 2;
	return (dx * dx + dy * dy <= (ballRadius * ballRadius));
}

function UpdateGame() {
	if (player1moveup && paddle1Y > 0) {
		paddle1Y -= 7;
	}
	if (player1movedown && paddle1Y < canvas.height - paddleHeight) {
		paddle1Y += 7;
	}

	if (player2moveright && paddle2X < canvas.width - paddleHeight) {
		paddle2X += 7;
	}
	if (player2moveleft && paddle2X > 0) {
		paddle2X -= 7;
	}

	if (player3moveright && paddle3X < canvas.width - paddleHeight) {
		paddle3X += 7;
	}
	if (player3moveleft && paddle3X > 0) {
		paddle3X -= 7;
	}

	if (player4moveup && paddle4Y > 0) {
		paddle4Y -= 7;
	}
	if (player4movedown && paddle4Y < canvas.height - paddleHeight) {
		paddle4Y += 7;
	}

	ballX += ballspeedX;
	ballY += ballspeedY;

	if (ballX - ballRadius < 0) {
		ballReset();
		updateScore();
	}

	if (ballX + ballRadius > canvas.width) {
		ballReset();
		updateScore();
	}

	if (ballY - ballRadius < 0) {
		ballReset();
		updateScore();
	}

	if (ballY + ballRadius > canvas.height) {
		ballReset();
		updateScore();
	}

	if (RectCircleColliding(ballX, ballY, 5, paddle1Y, paddleWidth, paddleHeight)) {
		ballspeedX = -ballspeedX;

		let paddleCenterY = paddle1Y + paddleHeight / 2;
		let impactY = ballY - paddleCenterY;
		let impactRatio = impactY / (paddleHeight / 2);

		ballspeedY = impactRatio * 4; 

		lastTouch = player1;
	}

    if (RectCircleColliding(ballX, ballY, paddle2X, 5, paddleHeight, paddleWidth)) {
		ballspeedY = -ballspeedY;

		let paddleCenterX = paddle2X + paddleHeight / 2;
		let impactX = ballX - paddleCenterX;
		let impactRatio = impactX / (paddleHeight / 2);

		ballspeedX = impactRatio * 4; 

		lastTouch = player2;
	}

    if (RectCircleColliding(ballX, ballY, paddle3X, canvas.height - paddleWidth - 5, paddleHeight, paddleWidth)) {
		ballspeedY = -ballspeedY;

		let paddleCenterX = paddle3X + paddleHeight / 2;
		let impactX = ballX - paddleCenterX;
		let impactRatio = impactX / (paddleHeight / 2);

		ballspeedX = impactRatio * 4; 

		lastTouch = player3;
	}

    if (RectCircleColliding(ballX, ballY, canvas.height - paddleWidth - 5, paddle4Y, paddleWidth, paddleHeight)) {
		ballspeedX = -ballspeedX;

		let paddleCenterY = paddle4Y + paddleHeight / 2;
		let impactY = ballY - paddleCenterY;
		let impactRatio = impactY / (paddleHeight / 2);

		ballspeedY = impactRatio * 4; 

		lastTouch = player4;
	}
}


function gameLoop() {
	if (!game_ended) {
		draw();
		UpdateGame();
		requestAnimationFrame(gameLoop);
	} else {
		draw();
		document.removeEventListener('keydown', handleKeydown);
		document.removeEventListener('keyup', handleKeyup);
	}
}

export async function initComponent() {
	paddle1Y = (canvas.height - paddleHeight) / 2;
	paddle2X = (canvas.width - paddleHeight) / 2;
    paddle3X = (canvas.width - paddleHeight) / 2;
	paddle4Y = (canvas.height - paddleHeight) / 2;
	player1moveup = false;
	player1movedown = false;
	player2moveright = false;
	player2moveleft = false;
	player3moveright = false;
	player3moveleft = false;
	player4moveup = false;
	player4movedown = false;
	lastTouch = null;
	ballX = canvas.width / 2;
	ballY = canvas.height / 2;
	ballspeedX = 4;
	ballspeedY = 0.1;
	player1Score = 0;
	player2Score = 0;
	player3Score = 0;
	player4Score = 0;

	game_started = false;

	const urlParams = new URLSearchParams(window.location.search);
	player1 = urlParams.get('player1');
	player2 = urlParams.get('player2');
	player3 = urlParams.get('player3');
	player4 = urlParams.get('player4');
	if (!player1 || !player2 || !player3 || !player4)
	{
		customalert('Error', 'Missing player names', true);
		router.navigate('/pong');
	}

	document.addEventListener('keydown', handleKeydown);
	document.addEventListener('keyup', handleKeyup);


	game_started = true;
	gameLoop();
}

export function cleanupComponent() {
	document.removeEventListener('keydown', handleKeydown);
	document.removeEventListener('keyup', handleKeyup);
}
