import config from "../../../env/config.js";
import { get_user } from '../../../../components/user/script.js';
import { customalert } from "../../../components/alert/script.js";
import { router } from '../../../app.js';
import { refresh_user } from "../../../components/user/script.js";

let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');

let backgroundCanvas = document.getElementById("backgroundCanvas");
let bgCtx = backgroundCanvas.getContext("2d");

let backgroundImage = new Image();
backgroundImage.src = '../../static/assets/jpg/bg_flappy.png';
let mapSkin;

function drawBackground() {
    bgCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

	let backgroundPath

    if (mapSkin == 'map2')
        backgroundPath = '../../static/assets/jpg/bg_flappy2.png';
    else 
        backgroundPath = '../../static/assets/jpg/bg_flappy.png';
 

    const backgroundImage = new Image();
    backgroundImage.src = backgroundPath;
    backgroundImage.onload = () => {
        bgCtx.drawImage(backgroundImage, 0, 0, backgroundCanvas.width, backgroundCanvas.height);
    };
}

// Gestion animation
let playerImages = {
	idle: new Image(),
	jump1: new Image(),
	jump2: new Image(),
	jump3: new Image()
};

playerImages.idle.src = '../../static/assets/jpg/fly1.png' ;
playerImages.jump1.src = '../../static/assets/jpg/fly2.png' ;
playerImages.jump2.src = '../../static/assets/jpg/fly3.png' ;
playerImages.jump3.src = '../../static/assets/jpg/fly4.png' ;

let currentPlayerImage = playerImages.idle;
let animationFrame = 0;
let isAnimating = false;
let animationInterval;

const OBSTACLE_WIDTH = 60;
const HOLE_HEIGHT = 200;
const GRAVITY = 0.5;
const JUMP_STRENGTH = -2.5;

let game_speed;
let jump;

let player1;
let player2;
let player;
let viewer;
let user;
let game_started;
let game_ended;


let lastUpdateTime;
let lastGameState;

let startTime;
let socket;

let pingIntervalID;
let pingSpan;

function handleKeydown(e) {
	if (viewer || !game_started)
		return;

	if (e.key === ' ') {
		socket.send(JSON.stringify({ message: 'jump', pressed: true }));
		jump = true;
		startJumpAnimation();
	}
}

function handleKeyup(e) {
	if (viewer || !game_started)
		return;

	if (e.key === ' ') {
		socket.send(JSON.stringify({ message: 'jump', pressed: false }));
	}
}

function startJumpAnimation() {
	if (isAnimating) return;

	isAnimating = true;
	animationFrame = 0;

	const animationImages = [playerImages.jump1, playerImages.jump2, playerImages.jump3];
	const animationDuration = 100;

	animationInterval = setInterval(() => {
		if (animationFrame < animationImages.length) {
			currentPlayerImage = animationImages[animationFrame];
			animationFrame++;
		} else {
			currentPlayerImage = playerImages.idle;
			clearInterval(animationInterval);
			isAnimating = false;
		}
	}, animationDuration);
}

function drawObstacle(x, holeY) {
	ctx.fillStyle = 'black';
	ctx.fillRect(x, 0, OBSTACLE_WIDTH, holeY);
	ctx.fillRect(x, holeY + HOLE_HEIGHT, OBSTACLE_WIDTH, canvas.height - (holeY + HOLE_HEIGHT));
	ctx.fillStyle = 'red';
	ctx.fillRect(x + 3, 0, OBSTACLE_WIDTH - 6, holeY - 2);
	ctx.fillRect(x + 3, holeY + HOLE_HEIGHT + 2, OBSTACLE_WIDTH - 6, canvas.height - (holeY + HOLE_HEIGHT));
}

function draw(interpolatedState) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.drawImage(currentPlayerImage, 100, interpolatedState.player.y, 36, 42);

	for (let i = 0; i < interpolatedState.obstacles.length; i++) {
		const obstacle = interpolatedState.obstacles[i];
		drawObstacle(obstacle.x, obstacle.holeY);
	}

	ctx.font = "40px flappyFont";
	ctx.textAlign = "center";
	ctx.lineWidth = 7;
	ctx.strokeStyle = "black";
	ctx.strokeText(interpolatedState.player.score, canvas.width / 2, 50);
	ctx.fillStyle = "white";
	ctx.fillText(interpolatedState.player.score, canvas.width / 2, 50);
}

function draw_reset() {
	draw({ player: { y: canvas.height / 2, score: lastGameState ? lastGameState.player.score : 0 }, obstacles: [] });
}

function interpolateGameState(currentTime) {
	if (!lastGameState) return;

	const elapsedTime = currentTime - lastUpdateTime;
	const t = elapsedTime / (1000 / 60);

	let interpolatedObstacles = [];
	for (let i = 0; i < lastGameState.obstacles.length; i++) {
		const obstacle = lastGameState.obstacles[i];
		if (obstacle.x < -OBSTACLE_WIDTH) game_speed += 0.1;
		const interpolatedObstacle = {
			x: obstacle.x - t * (game_speed + 3),
			holeY: obstacle.holeY
		};
		interpolatedObstacles.push(interpolatedObstacle);
	}

	let jump_height = 0;

	if (jump) jump_height = JUMP_STRENGTH * t;

	let player = {
		y: lastGameState.player.y + t * GRAVITY + jump_height,
		score: lastGameState.player.score
	}

	const interpolatedState = {
		player1: lastGameState.player1,
		player2: lastGameState.player2,
		player: player,
		game_speed: game_speed,
		obstacles: interpolatedObstacles
	};

	draw(interpolatedState);
}

function updateGame(data) {
	lastUpdateTime = Date.now();

	lastGameState = {
		player1: data["player1"],
		player2: data["player2"],
		player: data[player],
		game_speed: data["game_speed"],
		obstacles: data["obstacles"]
	};
	game_speed = data["game_speed"];

	jump = false;
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
	
	parentDiv.appendChild(buttonDiv);
	document.getElementById('button-return').addEventListener('click', function() {
		console.log("button clicked");
		router.navigate("/character");
	});
}

class FlappySocket {
	constructor(game_room) {
		this.socket = null;
		this.game_room = game_room;
	}

	onopen() {
		console.log("Connected to the Flappy websocket");
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
			let winner = data.winner === player1.id ? "player1" : "player2";
			customalert('GG', "Winner score is " + lastGameState[winner].score);
			clearInterval(pingIntervalID);
			closeButton();
			game_ended = true;
		}
		else if (data.type === 'game_loose') {
			let winner = data.winner === player1.id ? player1.username : player2.username;
			let win = data.winner === user.id;
			if (win == false)
			{
				this.close();
				clearInterval(pingIntervalID);
				closeButton();
				game_ended = true;
			}
			customalert('Game Over', "Winner is " + winner, !win);
		}
		else if (data.type === 'viewer')
			viewer = true;
		else if (data.type === 'error') {
			customalert('Error', data.message, true);
			router.navigate('/flappy');
		}
		else if (data.type === 'pong')
			pingSpan.innerHTML = Date.now() - startTime;
	}

	onclose() {
		console.log("Disconnected from the Flappy websocket");
	}

	send(data) {
		this.socket.send(data);
	}

	open() {
		if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
			this.socket = new WebSocket(config.websocketurl + '/ws/flappy/' + this.game_room + '/');
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
	const response_game = await fetch(config.backendUrl + '/flappy/games/' + game_id + '/', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
		credentials: 'include'
	});

	if (response_game.status !== 200) {
		console.error('Error connecting to game');
		router.navigate('/flappy');
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

	canvas = document.getElementById('gameCanvas');
	ctx = canvas.getContext('2d');

	backgroundCanvas = document.getElementById("backgroundCanvas");
	bgCtx = backgroundCanvas.getContext("2d");

	let backgroundPath

    if (mapSkin == 'map2')
        backgroundPath = '../../static/assets/jpg/bg_flappy2.png';
    else 
        backgroundPath = '../../static/assets/jpg/bg_flappy.png';
 

    const backgroundImage = new Image();
    backgroundImage.src = backgroundPath;
    backgroundImage.onload = () => {
        bgCtx.drawImage(backgroundImage, 0, 0, backgroundCanvas.width, backgroundCanvas.height);
    };

	// Gestion animation
	playerImages = {
		idle: new Image(),
		jump1: new Image(),
		jump2: new Image(),
		jump3: new Image()
	};

	playerImages.idle.src = '../../static/assets/jpg/fly1.png' ;
	playerImages.jump1.src = '../../static/assets/jpg/fly2.png' ;
	playerImages.jump2.src = '../../static/assets/jpg/fly3.png' ;
	playerImages.jump3.src = '../../static/assets/jpg/fly4.png' ;

	currentPlayerImage = playerImages.idle;
	animationFrame = 0;
	isAnimating = false;
	animationInterval;

	game_speed = null;
	player1 = null;
	player2 = null;
	player = null;
	viewer = null;
	startTime = null;
	pingIntervalID = null;

	game_speed = 0;
	game_ended = false;
	game_started = false;
	jump = false;

	lastUpdateTime = Date.now();
	lastGameState = null;

	await new Promise((resolve, reject) => setTimeout(resolve, 100));
	user = await get_user();
	if (!user)
		router.navigate('/');

	pingSpan = document.getElementById("ping");

	const urlParams = new URLSearchParams(window.location.search);
	const game_room = urlParams.get('game_room');
	const game_id = urlParams.get('game_id');
	mapSkin =  urlParams.get('map');
	if (!game_room || !game_id)
		router.navigate('/flappy');

	await get_game_players(game_id);
	if (!player1 || !player2) {
		console.error('Error getting the game');
		customalert('Error', 'Error connecting to the game', true);
		router.navigate('/flappy');
	}
	player = player1.id === user.id ? "player1" : "player2";

	try {
		socket = new FlappySocket(game_room);
		socket.open();
	} catch (error) {
		console.error(error);
		customalert('Error', 'Error connecting to the game', true);
		router.navigate('/flappy');
	}

	document.addEventListener('keydown', handleKeydown);
	document.addEventListener('keyup', handleKeyup);
	drawBackground();
	draw_reset();

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

	document.removeEventListener('keydown', handleKeydown);
	document.removeEventListener('keyup', handleKeyup);

	await refresh_user();
}
