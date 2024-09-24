import config from "../../../env/config.js";
import { get_user } from '../../../../components/user/script.js';
import { customalert } from "../../../components/alert/script.js";
import { router } from '../../../app.js';

const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");

const paddleWidth = 10;
const paddleHeight = 75;
const ballRadius = 8;

let paddle1Y = (canvas.height - paddleHeight) / 2;
let paddle2Y = (canvas.height - paddleHeight) / 2;
let paddle1speed = 4;
let paddle2speed = 4;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballspeedX = 4;
let ballspeedY = 4;
let player1Score = 0;
let player2Score = 0;

let player1 = false;
let player2 = false;
let viewer = false;
let game_started = false;
let game_ended = false;

let lastUpdateTime = Date.now();
let lastGameState = null;

let startTime;

export async function initComponent() {
	const user = await get_user();
	if (!user)
		router.navigate('/login');

	let pingSpan = document.getElementById("ping");

	const urlParams = new URLSearchParams(window.location.search);
	const game_room = urlParams.get('game_room');
	const game_id = urlParams.get('game_id');
	if (!game_room || !game_id)
		router.navigate('/pong');

	const response_game = await fetch(config.backendUrl + '/pong/games/' + game_id + '/', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
		credentials: 'include'
	});

	if (response_game.status !== 200) {
		console.error('Error connecting to game');
		router.navigate('/pong');
	}

	let response_game_data = await response_game.json();
	response_game_data = response_game_data.game;

	let player1_id = response_game_data.player1_id;
	let player2_id = response_game_data.player2_id;

	const responseplayer1 = await fetch(config.backendUrl + '/user/' + player1_id + '/', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
		credentials: 'include'
	});

	const responseplayer2 = await fetch(config.backendUrl + '/user/' + player2_id + '/', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
		credentials: 'include'
	});

	if (responseplayer1.status !== 200 || responseplayer2.status !== 200) {
		console.error('Error connecting to game');
		router.navigate('/pong');
	}

	player1 = (await responseplayer1.json()).user;
	player2 = (await responseplayer2.json()).user;

	const socket = new WebSocket(config.websocketurl + '/ws/pong/' + game_room + '/');
	if (!socket) {
		console.error('Error connecting to websocket');
		router.navigate('/pong');
	}

	socket.onmessage = async function (e) {
		let data = JSON.parse(e.data);
		if (data.type === 'game_update')
			updateGame(data.message);
		else if (data.type === 'game_started')
			game_started = true;
		else if (data.type === 'game_end')
			game_ended = true;
		else if (data.type === 'viewer')
			viewer = true;
		else if (data.type === 'error') {
			customalert('Error', data.message, true);
			router.navigate('/pong');
		}
		else if (data.type === 'pong')
			pingSpan.innerHTML = Date.now() - startTime;
	};

	setInterval(() => {
		startTime = Date.now();
		socket.send(JSON.stringify({ message: 'ping' }));
	}, 100);

	document.addEventListener('keydown', function (e) {
		if (viewer || !game_started)
			return;

		if (e.key === 'ArrowUp')
			socket.send(JSON.stringify({ message: 'keydown', direction: 'up' }));
		else if (e.key === 'ArrowDown')
			socket.send(JSON.stringify({ message: 'keydown', direction: 'down' }));
	});

	document.addEventListener('keyup', function (e) {
		if (viewer || !game_started)
			return;

		if (e.key === 'ArrowUp')
			socket.send(JSON.stringify({ message: 'keyup', direction: 'up' }));
		else if (e.key === 'ArrowDown')
			socket.send(JSON.stringify({ message: 'keyup', direction: 'down' }));
	});

	draw_reset();

	gameLoop();
}

function draw(interpolatedState) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = 'black';
	ctx.fillRect(5, interpolatedState.paddle1Y, paddleWidth, paddleHeight);
	ctx.fillRect(canvas.width - paddleWidth - 5, interpolatedState.paddle2Y, paddleWidth, paddleHeight);

	ctx.beginPath();
	ctx.arc(interpolatedState.ballX, interpolatedState.ballY, ballRadius, 0, Math.PI * 2);
	ctx.fillStyle = 'red';
	ctx.fill();
	ctx.closePath();

	ctx.font = '20px Arial';
	ctx.fillText(`${player1.username}: ${player1Score}`, 20, 20);
	ctx.fillText(`${player2.username}: ${player2Score}`, canvas.width - 200, 20);
}

function draw_reset() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = 'black';
	ctx.fillRect(5, (canvas.height - paddleHeight) / 2, paddleWidth, paddleHeight);
	ctx.fillRect(canvas.width - paddleWidth - 5, (canvas.height - paddleHeight) / 2, paddleWidth, paddleHeight);

	ctx.beginPath();
	ctx.arc(canvas.width / 2, canvas.height / 2, ballRadius, 0, Math.PI * 2);
	ctx.fillStyle = 'red';
	ctx.fill();
	ctx.closePath();

	ctx.font = '20px Arial';
	ctx.fillText(`${player1.username}: ${player1Score}`, 20, 20);
	ctx.fillText(`${player2.username}: ${player2Score}`, canvas.width - 200, 20);
}

function interpolateGameState(currentTime) {
	if (!lastGameState) return;

	const elapsedTime = currentTime - lastUpdateTime;
	const t = elapsedTime / (1000 / 60);

	const interpolatedState = {
		ballX: lastGameState.ball.x + ballspeedX * t,
		ballY: lastGameState.ball.y + ballspeedY * t,
		paddle1Y: paddle1Y,
		paddle2Y: paddle2Y,
	};

	draw(interpolatedState);
}

function updateGame(data) {
	lastUpdateTime = Date.now();
	lastGameState = {
		ball: { x: ballX, y: ballY, speed_x: ballspeedX, speed_y: ballspeedY },
		player1: { y: paddle1Y, score: player1Score, speed: paddle1speed },
		player2: { y: paddle2Y, score: player2Score, speed: paddle2speed },
	};

	ballX = data.ball.x;
	ballY = data.ball.y;
	ballspeedX = data.ball.speed_x;
	ballspeedY = data.ball.speed_y;
	paddle1Y = data.player1.y;
	paddle2Y = data.player2.y;
	paddle1speed = data.player1.speed;
	paddle2speed = data.player2.speed;
	player1Score = data.player1.score;
	player2Score = data.player2.score;
}

function gameLoop() {
	const currentTime = Date.now();
	if (!game_ended) {
		interpolateGameState(currentTime);
		requestAnimationFrame(gameLoop);
	}
	else
		draw_reset();
}