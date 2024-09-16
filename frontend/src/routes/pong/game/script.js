import config from "../../../env/config.js";
import { get_user } from '../../../../components/user/script.js';

let canvas = document.getElementById("pongCanvas");
let ctx = canvas.getContext("2d");

let viewer = false;

const user = await get_user();
if (!user)
	window.location.href = '/login';

const urlParams = new URLSearchParams(window.location.search);
const game_id = urlParams.get('game_id');
if (!game_id)
	window.location.href = '/pong';

function interpolate(currentPos, targetPos, speed) {
	return currentPos + (targetPos - currentPos) * speed;
}

function drawBall(x, y) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.beginPath();
	ctx.arc(x, y, 10, 0, Math.PI * 2);
	ctx.fill();
}

function updateGame(data) {
	ball.x = interpolate(ball.x, data.ball.x, 0.1);
	ball.y = interpolate(ball.y, data.ball.y, 0.1);
	drawBall(ball.x, ball.y);
}

const socket = new WebSocket(config.websocketurl + '/ws/pong/' + game_id + '/');
if (!socket) {
	console.error('Error connecting to websocket');
	window.location.href = '/pong';
}

socket.onmessage = function(e) {
	let data = JSON.parse(e.data);
	console.log(data);
	if (data.type === 'game_state')
		updateGame(data);
	else if (data.type === 'viewer')
		viewer = true;
	else if (data.type === 'error')
		window.location.href = '/pong';
};
