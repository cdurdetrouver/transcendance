import { customalert } from '../../components/alert/script.js';
import config from '../../env/config.js';
import { get_user } from '../../components/user/script.js';
import { router } from '../../app.js';

async function get_games(user_id) {
	const response = await fetch(config.backendUrl + '/user/games/' + user_id, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json'
		},
		credentials: 'include'
	});
	if (response.status !== 200) {
		console.error('Error connecting to user');
		customalert('Error', 'Error get games for user', true);
		return null;
	}
	const games = await response.json();
	console.log(games);
	return games.games;
}

function addGame(player1, player1_score, player2, player2_score) {
	const game_list = document.querySelector('.game-list');
	const game = document.createElement('li');
	game.innerHTML = `
		<div class="game-info">
			<div>${player1.username}</div>
			<div class="score">${player1_score} - ${player2_score}</div>
			<div>${player2.username}</div>
		</div>
	`;
	game_list.appendChild(game);
}

function setPersonalUser(user) {
	const containerDiv = document.querySelector('.container');
	const userDiv = document.createElement('div');
	const username = user.username;
	const email = user.email;
	const profile_picture = user.picture_remote ? user.picture_remote : config.backendUrl + user.profile_picture;
	const userHtml = `
		<div class="user__info">
			<p class="user__info__username">${username}</p>
			<p class="user__info__email">${email}</p>
			<img src="${profile_picture}" alt="Profile Picture">
		</div>
		<div class="user__buttons">
			<button class="user__buttons__edit" onclick="router.navigate('/user/edit')">Edit</button>
			<button class="user__buttons__logout" onclick="logout()">Logout</button>
		</div>
	`;
	userDiv.innerHTML = userHtml;
	if (containerDiv.firstChild) {
		containerDiv.insertBefore(userDiv, containerDiv.firstChild);
	} else {
		containerDiv.appendChild(userDiv);
	}
}

function setUser(user) {
	const userDiv = document.querySelector('.container');
	const username = user.username;
	const email = user.email;
	const profile_picture = user.picture_remote ? user.picture_remote : config.backendUrl + user.profile_picture;
	const userHtml = `
		<div class="user__info">
			<p class="user__info__username">${username}</p>
			<p class="user__info__email">${email}</p>
			<img src="${profile_picture}" alt="Profile Picture">
		</div>
	`;
	userDiv.innerHTML = userHtml;
}

export async function initComponent() {
	let me = await get_user();
	if (!me) {
		customalert('Error', 'You are not logged in', true);
		router.navigate('/');
	}
	const urlparams = new URLSearchParams(window.location.search);
	const id = urlparams.get('id');

	let user = null;

	if (id) {
		const response = await fetch(config.backendUrl + '/user/' + id, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include'
		});
		if (response.status !== 200) {
			console.error('Error connecting to user');
			customalert('Error', 'User does not exist', true);
			router.navigate('/');
		}
		user = await response.json();
	}

	const games = await get_games(id || me.id);
	if (!games)
		router.navigate('/');
	for (const game of games) {
		addGame(game.player1, game.player1_score, game.player2, game.player2_score);
	}

	if (user)
		setUser(user.user);
	else
		setPersonalUser(me);
}

export async function cleanupComponent() {
}
