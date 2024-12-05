import config from "../../../env/config.js";
import { get_user } from '../../../../components/user/script.js';
import { customalert } from "../../../components/alert/script.js";
import { router } from '../../../app.js';
import { deleteCookie } from "../../../components/storage/script.js";
import { refresh_user } from "../../../components/user/script.js";

let canvas;
let ctx;

let backgroundCanvas;
let backgroundCtx;

let lifeCanvas;
let lifeCtx;

let heartImage;
let heartEmptyImage;

let ballImage;

let idleImage;
let idleImageLeft;

let boot;
let sword;

const characterMap = ['isaac', 'cain', 'maggie', 'juda','blue', 'eve'];
let characterImages;

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

let paddleBodyImages;

let currentBodyFrame = 0;
let animationIntervalID = null;

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
let player1Force;
let player1Speed;
let player1Character;

let player2InitialScore;
let player2Force;
let player2Speed;
let player2Character;

function loadImages(characterNames) {
    const images = {};

    characterNames.forEach(name => {
        images[name] = {
            front: new Image(),
            back: new Image(),
            left: new Image(),
            right: new Image(),
        };
        images[name].front.src = `../../../static/assets/pong/head/${name}_front.png`;
        images[name].back.src = `../../../static/assets/pong/head/${name}_back.png`;
        images[name].left.src = `../../../static/assets/pong/head/${name}_left.png`;
        images[name].right.src = `../../../static/assets/pong/head/${name}_right.png`;
    });
    return images;
}

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


function drawBackground() {
    backgroundCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

    const backgroundImage = new Image();
    backgroundImage.src = '../../../static/assets/background/pongBG2.png'	;
    backgroundImage.onload = () => {
        backgroundCtx.drawImage(backgroundImage, 0, 0, backgroundCanvas.width, backgroundCanvas.height);
    };
}

function drawStats() {
    backgroundCtx.font = "14px";
    backgroundCtx.fillStyle = "white";

    backgroundCtx.drawImage(boot, 20, 80, 38, 24);
    backgroundCtx.fillText(player1Speed, 70, 100);
	backgroundCtx.drawImage(sword, 27, 115, 26, 26);
    backgroundCtx.fillText(player1Force, 70, 135);

	backgroundCtx.drawImage(boot, backgroundCanvas.width - boot.width - 20, 80, 38, 24);
    backgroundCtx.fillText(player2Speed, backgroundCanvas.width - 70, 100);
	backgroundCtx.drawImage(sword, backgroundCanvas.width - sword.width - 27, 115, 26, 26);
    backgroundCtx.fillText(player2Force, backgroundCanvas.width - 70, 135);
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
    lifeCtx.clearRect(0, 0, backgroundCanvas.width, 70);
	
    for (let i = 0; i < player1InitialScore; i++) {
		let heartToDraw = (i < player1Score) ? heartImage : heartEmptyImage; 
        lifeCtx.drawImage(heartToDraw, 20 + i * 50, 10, 50, 50);
		}

	for (let i = 0; i < player2InitialScore; i++) {
		let heartToDraw = (i < player2Score) ? heartImage : heartEmptyImage;
		lifeCtx.drawImage(heartToDraw, backgroundCanvas.width - 20 - (i + 1) * 50, 10, 50, 50);
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

function draw(interpolatedState) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const player1Name = characterMap[player1Character];
    const player2Name = characterMap[player2Character];

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
    if (paddle1movedown) {
        headPlayer1 = characterImages[player1Name].front;
    } else if (paddle1moveup) {
        headPlayer1 = characterImages[player1Name].back;
    } else {
        headPlayer1 = characterImages[player1Name].right;
    }

    ctx.drawImage(
        headPlayer1,
        5,
        interpolatedState.paddle1Y,
        56,
		characterImages[player1Name].right.height
    );

    // Paddle 2 logic
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
    if (paddle2movedown) {
        headPlayer2 = characterImages[player2Name].front;
    } else if (paddle2moveup) {
        headPlayer2 = characterImages[player2Name].back;
    } else {
        headPlayer2 = characterImages[player2Name].left;
    }

    ctx.drawImage(
        headPlayer2,
        canvas.width - paddleWidth - 10,
        interpolatedState.paddle2Y,
		56,
		characterImages[player2Name].right.height
    );

    // Draw the ball
    ctx.drawImage(
        ballImage,
        interpolatedState.ballX - ballRadius,
        interpolatedState.ballY - ballRadius,
        ballRadius * 2,
        ballRadius * 2
    );

    drawScores();
}


function draw_reset() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const player1Name = characterMap[player1Character];
    const player2Name = characterMap[player2Character];

    ctx.drawImage(
        idleImage,
        15,
        (canvas.height - paddleHeight) / 2 + 38,
        34,
        paddleHeight - 32
    );
    ctx.drawImage(
        characterImages[player1Name].right,
        5,
        (canvas.height - paddleHeight) / 2,
        characterImages[player1Name].right.width,
        characterImages[player1Name].right.height
    );

    ctx.drawImage(
        idleImageLeft,
        canvas.width - paddleWidth,
        (canvas.height - paddleHeight) / 2 + 38,
        34,
        paddleHeight - 32
    );
    ctx.drawImage(
        characterImages[player2Name].left,
        canvas.width - paddleWidth - 10,
        (canvas.height - paddleHeight) / 2,
        characterImages[player2Name].left.width,
        characterImages[player2Name].left.height
    );

    ctx.drawImage(
        ballImage,
        canvas.width / 2 - ballRadius,
        canvas.height / 2 - ballRadius,
        ballRadius * 2,
        ballRadius * 2
    );

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

	if (nextpaddle1Y < 0)
		nextpaddle1Y = 0;
	if (nextpaddle1Y + paddleHeight > 400)
		nextpaddle1Y = 400 - paddleHeight;

	if (paddle2moveup)
		nextpaddle2Y -= paddle2speed * t;
	else if (paddle2movedown)
		nextpaddle2Y += paddle2speed * t;

	if (nextpaddle2Y < 0)
		nextpaddle2Y = 0;
	if (nextpaddle2Y + paddleHeight > 400)
		nextpaddle2Y = 400 - paddleHeight;

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
		player1Force = data.player1.force;
		player1Speed = data.player1.speed;
		player1Character = data.player1.id.id;
		player2InitialScore = data.player2.score
		player2Force = data.player2.force;
		player2Speed = data.player2.speed;
		player2Character = data.player2.id.id;
		drawStats();
	}
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
		router.navigate("/character");
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
	canvas = document.getElementById("pongCanvas");
	ctx = canvas.getContext("2d");

	backgroundCanvas = document.getElementById("backgroundCanvas");
	backgroundCtx = backgroundCanvas.getContext("2d");

	lifeCanvas = document.getElementById("lifeCanvas");
	lifeCtx = lifeCanvas.getContext("2d");

	heartImage = new Image();
	heartImage.src = '../../../static/assets/pong/heart.png';
	heartEmptyImage = new Image();
	heartEmptyImage.src = '../../../static/assets/pong/heart_empty.png'; 

	ballImage = new Image();
	ballImage.src = '../../../static/assets/pong/bullet.png';

	idleImage = new Image();
	idleImage.src = '../../../static/assets/pong/resting.png';
	idleImageLeft = new Image();
	idleImageLeft.src = '../../../static/assets/pong/resting_left.png';

	boot = new Image();
	boot.src = '../../../static/assets/pong/boot.png'
	sword = new Image();
	sword.src = '../../../static/assets/pong/sword.png'

	characterImages = loadImages(characterMap);

	paddleBodyImages = paddleBodyAnimationFrames.map((src) => {
		const img = new Image();
		img.src = src;
		return img;
	});

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
	player1Force= 0;
	player1Speed= 0;
	player2InitialScore = 0;
	player2Force= 0;
	player2Speed= 0;
	player1Character = 0;
	player2Character = 0;

	lastUpdateTime = Date.now();
	lastGameState = null;

	game_ended = false;
	game_started = false;
	
	await new Promise((resolve, reject) => setTimeout(resolve, 100));
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

export async function cleanupComponent() {
	if (pingIntervalID) {
		clearInterval(pingIntervalID);
		pingIntervalID = null;
	}

	if (socket) {
		socket.close();
		socket = null;
	}

	game_ended = true;

	stopPaddleAnimation();

	document.removeEventListener('keydown', handleKeydown);
	document.removeEventListener('keyup', handleKeyup);

	deleteCookie('user');
	deleteCookie('access_token');

	await refresh_user();
}