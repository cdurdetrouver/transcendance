import config from "../../../env/config.js";
import { get_user } from '../../../../components/user/script.js';

const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");

const paddleWidth = 10;
const paddleHeight = 75;
const ballRadius = 8;

let paddle1Y = (canvas.height - paddleHeight) / 2;
let paddle2Y = (canvas.height - paddleHeight) / 2;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let moveup = false;
let movedown = false;
let player1Score = 0;
let player2Score = 0;

let viewer = false;
let game_started = false;

const user = await get_user();
if (!user)
	window.location.href = '/login';

const urlParams = new URLSearchParams(window.location.search);
const game_id = urlParams.get('game_id');
if (!game_id)
	window.location.href = '/pong';

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = 'black';
	ctx.fillRect(5, paddle1Y, paddleWidth, paddleHeight);
	ctx.fillRect(canvas.width - paddleWidth - 5, paddle2Y, paddleWidth, paddleHeight);

	ctx.beginPath();
	ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
	ctx.fillStyle = 'red';
	ctx.fill();
	ctx.closePath();

	ctx.font = '20px Arial';
	ctx.fillText(`Player 1: ${player1Score}`, 20, 20);
	ctx.fillText(`Player 2: ${player2Score}`, canvas.width - 120, 20);
}

function updateGame(data) {
	ballX = data.ball.x;
	ballY = data.ball.y;
	paddle1Y = data.player1.y;
	paddle2Y = data.player2.y;
	player1Score = data.player1.score
	player2Score = data.player2.score;

	if (moveup)
		socket.send(JSON.stringify({ message: 'move', direction: 'up' }));
	else if (movedown)
		socket.send(JSON.stringify({ message: 'move', direction: 'down' }));

	draw();
}

const socket = new WebSocket(config.websocketurl + '/ws/pong/' + game_id + '/');
if (!socket) {
	console.error('Error connecting to websocket');
	window.location.href = '/pong';
}

draw();

socket.onmessage = function (e) {
	let data = JSON.parse(e.data);
	console.log(data);
	if (data.type === 'game_update')
		updateGame(data.message);
	else if (data.type === 'game_started')
		game_started = true;
	else if (data.type === 'viewer')
		viewer = true;
	else if (data.type === 'error')
		window.location.href = '/pong';
};

document.addEventListener('keydown', function (e) {
	if (viewer || !game_started)
		return;

	if (e.key === 'ArrowUp') {
		moveup = true;
		console.log('up');
	}
	else if (e.key === 'ArrowDown') {
		movedown = true;
		console.log('down');
	}
});

document.addEventListener('keyup', function (e) {
	if (viewer || !game_started)
		return;

	if (e.key === 'ArrowUp') {
		moveup = false;
		console.log('up');
	}
	else if (e.key === 'ArrowDown') {
		movedown = false;
		console.log('down');
	}
});
