import config from "../../../env/config.js";
import { get_user } from '../../../../components/user/script.js';
import { customalert } from "../../../components/alert/script.js";
import { router } from '../../../app.js';

const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");

const backgroundCanvas = document.getElementById("backgroundCanvas");
const backgroundCtx = backgroundCanvas.getContext("2d");

const lifeCanvas = document.getElementById("lifeCanvas");
const lifeCtx = lifeCanvas.getContext("2d");

const heartImage = new Image();
heartImage.src = '../../../static/assets/pong/heart.png'; 

const paddleWidth = 10;
const paddleHeight = 75;
const ballRadius = 8;

let paddle1Y;
let paddle2Y;
let paddle1speed;
let paddle2speed;
let paddle1moveup;
let paddle1movedown;
let paddle2moveup;
let paddle2movedown;
let ballX;
let ballY;
let ballspeedX;
let ballspeedY;
let player1Score;
let player2Score;

let player1;
let player2;
let viewer;
let game_started;
let game_ended;

let lastUpdateTime;
let lastGameState;

let startTime;
let socket;

let pingIntervalID;
let pingSpan;

function drawBackground() {
    backgroundCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

    const backgroundImage = new Image();
    backgroundImage.src = '../../../static/assets/background/pongBG2.png'	;
    backgroundImage.onload = () => {
        backgroundCtx.drawImage(backgroundImage, 0, 0, backgroundCanvas.width, backgroundCanvas.height);
    };
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

function drawScores() {
    lifeCtx.clearRect(0, 0, canvas.width, 40); 
	
    for (let i = 0; i < player1Score; i++) {
        lifeCtx.drawImage(heartImage, 20 + i * 30, 10, 20, 20); 
    }

    for (let i = 0; i < player2Score; i++) {
        lifeCtx.drawImage(heartImage, canvas.width - 200 + i * 30, 10, 20, 20); 
    }
}

function handleKeydown(e) {	
	if (viewer || !game_started)
		return;

	if (e.key === 'ArrowUp') {
		socket.send(JSON.stringify({ message: 'keydown', direction: 'up' }));
	} else if (e.key === 'ArrowDown') {
		socket.send(JSON.stringify({ message: 'keydown', direction: 'down' }));
	}
}

function handleKeyup(e) {
	if (viewer || !game_started)
		return;

	if (e.key === 'ArrowUp') {
		socket.send(JSON.stringify({ message: 'keyup', direction: 'up' }));
	} else if (e.key === 'ArrowDown') {
		socket.send(JSON.stringify({ message: 'keyup', direction: 'down' }));
	}
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

	drawScores();
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

	drawScores();
}

function interpolateGameState(currentTime) {
	if (!lastGameState) return;

	const elapsedTime = currentTime - lastUpdateTime;
	const t = elapsedTime / (1000 / 60);

	let nextpaddle1Y = lastGameState.player1.y;
	let nextpaddle2Y = lastGameState.player2.y;

	if (paddle1moveup)
		nextpaddle1Y -= paddle1speed * t;
	else if (paddle1movedown)
		nextpaddle1Y += paddle1speed * t;

	if (paddle2moveup)
		nextpaddle2Y -= paddle2speed * t;
	else if (paddle2movedown)
		nextpaddle2Y += paddle2speed * t;

	const interpolatedState = {
		ballX: lastGameState.ball.x + ballspeedX * t,
		ballY: lastGameState.ball.y + ballspeedY * t,
		paddle1Y: nextpaddle1Y,
		paddle2Y: nextpaddle2Y,
	};

	draw(interpolatedState);
}

function updateGame(data) {
	lastUpdateTime = Date.now();
	lastGameState = {
		ball: { x: ballX, y: ballY, speed_x: ballspeedX, speed_y: ballspeedY },
		player1: { y: paddle1Y, score: player1Score, speed: paddle1speed, moveup: paddle1moveup, movedown: paddle1movedown },
		player2: { y: paddle2Y, score: player2Score, speed: paddle2speed, moveup: paddle2moveup, movedown: paddle2movedown }
	};

	ballX = data.ball.x;
	ballY = data.ball.y;
	ballspeedX = data.ball.speed_x;
	ballspeedY = data.ball.speed_y;
	paddle1Y = data.player1.y;
	paddle2Y = data.player2.y;
	paddle1moveup = data.player1.moveup;
	paddle1movedown = data.player1.movedown;
	paddle2moveup = data.player2.moveup;
	paddle2movedown = data.player2.movedown;
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

class PongSocket {
	constructor(game_room) {
		this.socket = null;
		this.game_room = game_room;
	}

	onopen() {
		console.log("Connected to the Pong websocket");
		pingIntervalID = setInterval(() => {
			startTime = Date.now();
			this.socket.send(JSON.stringify({ message: 'ping' }));
		}, 100);
	}

	onmessage(event) {
		let data = JSON.parse(event.data);
		console.log(data);
		if (data.type === 'game_update')
			updateGame(data.message);
		else if (data.type === 'game_started') {
			game_started = true;
		}
		else if (data.type === 'game_end') {
			let winner = data.winner === player1.id ? player1.username : player2.username;
			customalert('Game Over', data.message + " winner is " + winner);
			game_ended = true;
			clearInterval(pingIntervalID);
		}
		else if (data.type === 'viewer')
			viewer = true;
		else if (data.type === 'error') {
			customalert('Error', data.message, true);
			router.navigate('/pong');
		}
		else if (data.type === 'pong')
			pingSpan.innerHTML = Date.now() - startTime;
	}

	onclose() {
		console.log("Disconnected from the Pong websocket");
	}

	send(data) {
		this.socket.send(data);
	}

	open() {
		if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
			this.socket = new WebSocket(config.websocketurl + '/ws/pong/' + this.game_room + '/');
			this.socket.onopen = this.onopen.bind(this);
			this.socket.onmessage = this.onmessage.bind(this);
			this.socket.onclose = this.onclose.bind(this);
		}
	}

	close() {
		if (this.socket) {
			this.socket.close();
			this.socket = null;
		}
	}
}

async function get_game_players(game_id) {
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

	player1 = response_game_data.player1;
	player2 = response_game_data.player2;
}

export async function initComponent() {
	paddle1Y = (canvas.height - paddleHeight) / 2;
	paddle2Y = (canvas.height - paddleHeight) / 2;
	paddle1speed = 4;
	paddle2speed = 4;
	paddle1moveup = false;
	paddle1movedown = false;
	paddle2moveup = false;
	paddle2movedown = false;
	ballX = canvas.width / 2;
	ballY = canvas.height / 2;
	ballspeedX = 4;
	ballspeedY = 4;
	player1Score = 0;
	player2Score = 0;

	lastUpdateTime = Date.now();
	lastGameState = null;

	const user = await get_user();
	if (!user)
		router.navigate('/login?return=/pong');

	pingSpan = document.getElementById("ping");

	const urlParams = new URLSearchParams(window.location.search);
	const game_room = urlParams.get('game_room');
	const game_id = urlParams.get('game_id');
	if (!game_room || !game_id)
		router.navigate('/pong');

	await get_game_players(game_id);
	if (!player1 || !player2) {
		console.error('Error getting the game');
		customalert('Error', 'Error connecting to the game', true);
		router.navigate('/pong');
	}

	try {
		socket = new PongSocket(game_room);
		socket.open();
	} catch (error) {
		console.error(error);
		customalert('Error', 'Error connecting to the game', true);
		router.navigate('/pong');
	}

	document.addEventListener('keydown', handleKeydown);
	document.addEventListener('keyup', handleKeyup);

	draw_reset();
	centerPongCanvas();
	drawBackground();

	gameLoop();
}

export function cleanupComponent() {
	if (pingIntervalID) {
		clearInterval(pingIntervalID);
		pingIntervalID = null;
	}

	if (socket) {
		socket.close();
		socket = null;
	}

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	document.removeEventListener('keydown', handleKeydown);
	document.removeEventListener('keyup', handleKeyup);
}
