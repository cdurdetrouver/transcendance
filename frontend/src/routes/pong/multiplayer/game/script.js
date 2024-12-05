import { customalert } from "../../../../components/alert/script.js";
import { router } from '../../../../app.js';

const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");

const backgroundCanvas = document.getElementById("backgroundCanvas");
const backgroundCtx = backgroundCanvas.getContext("2d");

const lifeCanvas = document.getElementById("lifeCanvas");
const lifeCanvasCtx = lifeCanvas.getContext("2d");

const ballImage = new Image();
ballImage.src = '../../../../static/assets/multi/bullet.png';

let mapSkin;

function drawBackground() {
    backgroundCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

	let backgroundPath

    if (mapSkin == 'map3')
        backgroundPath = '../../../static/assets/background/pongBigBG3.png';
    else if (mapSkin == 'map2')
        backgroundPath = '../.././static/assets/background/pongBigBG2.png';
    else 
        backgroundPath = '../../../static/assets/background/pongBigBG1.png';

    const backgroundImage = new Image();
    backgroundImage.src = backgroundPath;
    backgroundImage.onload = () => {
        backgroundCtx.drawImage(backgroundImage, 0, 0, backgroundCanvas.width, backgroundCanvas.height);
    };
}

function updateScoreCanvas() {
	lifeCanvasCtx.clearRect(0, 0, lifeCanvas.width, lifeCanvas.height);

	lifeCanvasCtx.font = "20px arial";
	lifeCanvasCtx.fillStyle = "#fff"; 
	lifeCanvasCtx.fillText(`${player1Score}/5`, 20, lifeCanvas.height/2); //gauche
	lifeCanvasCtx.fillText(`${player2Score}/5`,  lifeCanvas.width / 2 - 15, 60); //top 
	lifeCanvasCtx.fillText(`${player3Score}/5`, lifeCanvas.width / 2 - 15, lifeCanvas.height - 40);  //bas
	lifeCanvasCtx.fillText(`${player4Score}/5`,  lifeCanvas.width - 60,   lifeCanvas.height/2	);

}

function centerPongCanvas() {
    const bgWidth = backgroundCanvas.width;
    const bgHeight = backgroundCanvas.height;
    const pongWidth = canvas.width;
    const pongHeight = canvas.height;

    const centerX = (bgWidth - pongWidth) / 2;
    const centerY = (bgHeight - pongHeight) / 2;
    canvas.style.left = `${centerX}px`;
    canvas.style.top = `${centerY}px`;
}

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

    ctx.drawImage(
        ballImage,
        ballX,
        ballY,
        ballRadius * 2,
        ballRadius * 2
    );

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
	updateScoreCanvas();
	if (player1Score >= 5 || player2Score >= 5 || player3Score >= 5 || player4Score >= 5) {
		game_ended = true;
		customalert('Game Over', lastTouch + ' wins!');
		closeButton();
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

function closeButton()
{
	console.log("game close function");
	const buttonDiv = document.createElement('div');
	buttonDiv.className = 'return-menu'; 
	buttonDiv.innerHTML =  `<input id="button-return" type="button" value="Return to menu" data-link>
	`;
	const parentDiv = document.getElementById("game-canvas");
	
	parentDiv.appendChild(buttonDiv)
	document.getElementById('button-return').addEventListener('click', function() {
        router.navigate('/multiplayer');
    });

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
	mapSkin =  urlParams.get('map');
	const player1div = document.querySelector(".name.left-name");
	const player2div = document.querySelector(".name.top-name");
	const player3div = document.querySelector(".name.bottom-name");
	const player4div = document.querySelector(".name.right-name");

	player1div.innerHTML = player1;
	player2div.innerHTML = player2;
	player3div.innerHTML = player3;
	player4div.innerHTML = player4;

	

	document.addEventListener('keydown', handleKeydown);
	document.addEventListener('keyup', handleKeyup);

	drawBackground();
	updateScoreCanvas();
	centerPongCanvas();
	game_started = true;
	gameLoop();
}

export function cleanupComponent() {
	document.removeEventListener('keydown', handleKeydown);
	document.removeEventListener('keyup', handleKeyup);
}
