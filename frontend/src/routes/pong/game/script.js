import config from "../../../env/config.js";
import { get_user } from '../../../../components/user/script.js';

console.log('Pong game script loaded');

let canvas = document.getElementById("pongCanvas");
let ctx = canvas.getContext("2d");

let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 4;
let ballSpeedY = 4;

let viewer = false;

let paddle1Y = 150;
let paddle2Y = 150;
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;

const user = await get_user();
if (!user)
	window.location.href = '/login';

const urlParams = new URLSearchParams(window.location.search);
const game_id = urlParams.get('game_id');
if (!game_id)
	window.location.href = '/pong';

const socket = new WebSocket(config.websocketurl + '/ws/pong/' + game_id + '/');
console.log(socket);

socket.onmessage = function(e) {
	let data = JSON.parse(e.data);
	if (data.type === 'viewer') 
		viewer = true;
	else if (data.type === 'error')
		window.location.href = '/pong';
	else if (data.type === 'game_update') {
		let gameData = data['game_data'];

		ballX = gameData.ballX;
		ballY = gameData.ballY;
		paddle1Y = gameData.paddle1Y;
		paddle2Y = gameData.paddle2Y;
	}
};

function drawEverything() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.fillRect(0, paddle1Y, PADDLE_WIDTH, PADDLE_HEIGHT);
	ctx.fillRect(canvas.width - PADDLE_WIDTH, paddle2Y, PADDLE_WIDTH, PADDLE_HEIGHT);

	ctx.beginPath();
	ctx.arc(ballX, ballY, 10, 0, Math.PI * 2, true);
	ctx.fill();
}

function moveBall() {
	ballX += ballSpeedX;
	ballY += ballSpeedY;

	if (ballY < 0 || ballY > canvas.height)
		ballSpeedY = -ballSpeedY;

	if (ballX < PADDLE_WIDTH && ballY > paddle1Y && ballY < paddle1Y + PADDLE_HEIGHT)
		ballSpeedX = -ballSpeedX;

	if (ballX > canvas.width - PADDLE_WIDTH && ballY > paddle2Y && ballY < paddle2Y + PADDLE_HEIGHT)
		ballSpeedX = -ballSpeedX;

	let gameData = {
		'ballX': ballX,
		'ballY': ballY,
		'paddle1Y': paddle1Y,
		'paddle2Y': paddle2Y
	};
	socket.send(JSON.stringify({'game_data': gameData}));
}

function gameLoop() {
	moveBall();
	drawEverything();
}

if (!socket) {
	console.error('Error connecting to websocket');
	window.location.href = '/pong';
}
else if (!viewer)
	setInterval(gameLoop, 1000 / 60);
