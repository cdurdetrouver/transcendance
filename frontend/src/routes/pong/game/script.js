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
const heartEmptyImage = new Image();
heartEmptyImage.src = '../../../static/assets/pong/heart_empty.png'; 

const ballImage = new Image();
ballImage.src = '../../../static/assets/pong/bullet.png';

const idleImage = new Image();
idleImage.src = '../../../static/assets/pong/resting.png';
const idleImageLeft = new Image();
idleImageLeft.src = '../../../static/assets/pong/resting_left.png';


const cart_head = new Image();
cart_head.src = '../../../static/assets/pong/isaac_head_cart.png';
const cart_head_right = new Image();
cart_head_right.src = '../../../static/assets/pong/isaac_head_cart_right.png';

const cart_head_down = new Image();
cart_head_down .src = '../../../static/assets/pong/isaac_head_cart_down.png';
const cart_head_up = new Image();
cart_head_up .src = '../../../static/assets/pong/isaac_head_cart_up.png';

const paddleBodyAnimationFrames = [
    '../../../static/assets/pong/moving_frame_1.png',
    '../../../static/assets/pong/moving_frame_2.png',
    '../../../static/assets/pong/moving_frame_3.png',
    '../../../static/assets/pong/moving_frame_4.png',
    '../../../static/assets/pong/moving_frame_5.png',
    '../../../static/assets/pong/moving_frame_6.png',
    '../../../static/assets/pong/moving_frame_7.png',
    '../../../static/assets/pong/moving_frame_8.png',
    '../../../static/assets/pong/moving_frame_9.png',
];

const paddleBodyImages = paddleBodyAnimationFrames.map((src) => {
    const img = new Image();
    img.src = src;
    return img;
});

let currentBodyFrame = 0;
let animationIntervalID = null;

function startBodyAnimation() {
    if (animationIntervalID) return;

    animationIntervalID = setInterval(() => {
        currentBodyFrame = (currentBodyFrame + 1) % paddleBodyImages.length;
    }, 100); 
}

function stopBodyAnimation() {
    if (animationIntervalID) {
        clearInterval(animationIntervalID);
        animationIntervalID = null;
        currentBodyFrame = 0;
    }
}

const paddleWidth = 56;
const paddleHeight = 66;
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

let player1InitialScore;
let player2InitialScore;


function drawBackground() {
    backgroundCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

    const backgroundImage = new Image();
    backgroundImage.src = '../../../static/assets/background/pongBG2.png'	;
    backgroundImage.onload = () => {
        backgroundCtx.drawImage(backgroundImage, 0, 0, backgroundCanvas.width, backgroundCanvas.height);
    };
}

function centerPongCanvas() {

	const leftX = 0;
	const topY = 0;

    const bgWidth = backgroundCanvas.width;
    const bgHeight = backgroundCanvas.height;
    const pongWidth = canvas.width;
    const pongHeight = canvas.height;

    const centerX = (bgWidth - pongWidth) / 2;
    const centerY = (bgHeight - pongHeight) / 2;

    canvas.style.left = `${centerX + leftX}px`;
    canvas.style.top = `${centerY + topY}px`;
	backgroundCanvas.style.left = `${leftX}px`;
	backgroundCanvas.style.top = `${topY}px`;
	lifeCanvas.style.left = `${leftX}px`;
	lifeCanvas.style.top = `${topY}px`;
}

function drawScores() {
    lifeCtx.clearRect(0, 0, canvas.width, 100);
	
    for (let i = 0; i < player1InitialScore; i++) {
		let heartToDraw = (i < player1Score) ? heartImage : heartEmptyImage; 
        lifeCtx.drawImage(heartToDraw, 20 + i * 50, 10, 50, 50); // Draw heart at calculated position
		}

    for (let i = 0; i < player2InitialScore; i++) {	
		let heartToDraw = (i < player2Score) ? heartImage : heartEmptyImage; 
        lifeCtx.drawImage(heartToDraw, canvas.width - 200 + i * 50, 10, 50, 50); 
    }
}

function handleKeydown(e) {	
	if (viewer || !game_started)
		return;

	if (e.key === 'ArrowUp') {
		startBodyAnimation();
		socket.send(JSON.stringify({ message: 'keydown', direction: 'up' }));
	} else if (e.key === 'ArrowDown') {
		startBodyAnimation();
		socket.send(JSON.stringify({ message: 'keydown', direction: 'down' }));
	}
}

function handleKeyup(e) {
	if (viewer || !game_started)
		return;

	if (e.key === 'ArrowUp') {
		stopBodyAnimation();
		socket.send(JSON.stringify({ message: 'keyup', direction: 'up' }));
	} else if (e.key === 'ArrowDown') {
		stopBodyAnimation();
		socket.send(JSON.stringify({ message: 'keyup', direction: 'down' }));
	}
}
let time = 0;

function draw(interpolatedState) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

    const paddle1BodyImage = (paddle1moveup || paddle1movedown)
        ? paddleBodyImages[currentBodyFrame]
        : idleImage; 
    ctx.drawImage(
        paddle1BodyImage,
        15,
        interpolatedState.paddle1Y + 38, 
        34,
        paddleHeight - 32
    );
	let headPlayer1;
	if (paddle1movedown)
		headPlayer1 = cart_head_down;
	else if(paddle1moveup)
		headPlayer1 = cart_head_up;
	else
		headPlayer1 = cart_head_right;
    ctx.drawImage(
        headPlayer1,
        5,
        interpolatedState.paddle1Y, 
        cart_head.width, 
        cart_head.height 
    );

	const paddle2BodyImage = (paddle2moveup || paddle2movedown)
	? paddleBodyImages[currentBodyFrame]
	: idleImageLeft; 

    ctx.drawImage(
        paddle2BodyImage,
        canvas.width - paddleWidth,
        interpolatedState.paddle2Y + 38,
        34,
        paddleHeight - 32
    );
	let headPlayer2;
	if (paddle2movedown)
		headPlayer2 = cart_head_down;
	else if(paddle2moveup)
		headPlayer2 = cart_head_up;
	else
		headPlayer2 = cart_head;
    ctx.drawImage(
        headPlayer2,
        canvas.width - paddleWidth - 10,
        interpolatedState.paddle2Y,
		cart_head.width,
        cart_head.height
    );

	ctx.drawImage(ballImage, interpolatedState.ballX - ballRadius, interpolatedState.ballY - ballRadius, ballRadius * 2, ballRadius * 2);

	drawScores();
}

function draw_reset() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(idleImage, 15, (canvas.height - paddleHeight) / 2 + 38, 34, paddleHeight - 32);
    ctx.drawImage(cart_head_right, 5, (canvas.height - paddleHeight) / 2, cart_head.width, cart_head.height );

    ctx.drawImage(idleImageLeft, canvas.width - paddleWidth, (canvas.height - paddleHeight) / 2 + 38, 34, paddleHeight - 32);
    ctx.drawImage(cart_head, canvas.width - paddleWidth - 10, (canvas.height - paddleHeight) / 2, cart_head.width, cart_head.height);

	ctx.drawImage(ballImage, canvas.width / 2 - ballRadius, canvas.height / 2 - ballRadius, ballRadius * 2, ballRadius * 2);
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
	if (lastGameState == null	)
	{
		player1InitialScore = data.player1.score;
		player2InitialScore = data.player2.score
	}
	console.log("TEST " + player1InitialScore);
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
        window.location.href = '/character';
    });

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
			closeButton();
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

	const profilePicture1 = player1.picture_remote ? player1.picture_remote : config.backendUrl + player1.profile_picture;
	const profilePicture2 = player2.picture_remote ? player2.picture_remote : config.backendUrl + player2.profile_picture;
	const player1block = document.getElementById('player1');
	const player2block = document.getElementById('player2');

	player1block.innerHTML = `
	<span class="profile-pic"> <img src="${profilePicture1}" height=100 alt="Room Picture"> </span> 
	<span class="player-name">${player1.username}</span>
	`;

	player2block.innerHTML = `
	<span class="player-name">${player2.username}</span>
	<span class="profile-pic"> <img src="${profilePicture2}" height=100 alt="Room Picture"> </span>
	`;
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
	player1InitialScore = 0;
	player2InitialScore = 0;

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

	stopPaddleAnimation();


	document.removeEventListener('keydown', handleKeydown);
	document.removeEventListener('keyup', handleKeyup);
}
