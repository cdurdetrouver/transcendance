import config from "../../env/config.js";
import { get_user } from "../../components/user/script.js";
import { router } from '../../app.js';
import {customalert} from '../../components/alert/script.js';
import { isThisYou } from '../account/script.js';

export async function initComponent(params) {

	let user = null;
	let me = await get_user();

	const urlparams = new URLSearchParams(window.location.search);
	const id = urlparams.get('id');

	if (id && id != me.id) {
		const response = await fetch(config.backendUrl + '/user/' + id, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include'
		});
		const data = await response.json();
		if (response.status !== 200) {
			console.error('Error connecting to user');
			customalert('Error', data.error, true);
			router.navigate('/');
		}
		user = data
	}
	if (me) {
		getPongHistoric(me.id);
		getFlappyHistoric(me.id);
		displayStats(me);
	}
	else  {
		getPongHistoric(user.id);
		getFlappyHistoric(user.id);
		displayStats(user);
	}


}

function displayStats(user) {
	
	console.log("wins = ", user.wins, "losses = ", user.losses);
	if (user.wins != null) {
		document.querySelector("#wins-count").innerHTML += user.wins;
	}
	if (user.looses != null) {
		document.querySelector("#losses-count").innerHTML += user.looses;
	}
	
}

function setPongHistoric (games) {
	
    if (!Array.isArray(games)) {
        console.error("Invalid data: 'games' should be an array", games);
        return;
	}
    games.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

	const matchList = document.getElementById("matchList");

	games.forEach(game => {
		const Matchline = document.createElement('div');
		Matchline.classList.add('Matchline');
		// Matchline.classList.add("text");
		matchList.appendChild(Matchline);

		const playerLine = document.createElement('div');
		playerLine.classList.add('playerLine');

		const player1block = document.createElement('div');
		player1block.classList.add('player-left');
		player1block.textContent = `${game.player1.username}`

		const player2block = document.createElement('div');
		player2block.classList.add('player-right');
		player2block.textContent = `${game.player2.username}`

		Matchline.appendChild(player1block);
		Matchline.appendChild(player2block);

		const playerLeftResult = document.createElement('div');
		const playerRightResult = document.createElement('div');
		if (game.winner != null) {
			if(game.winner.username == game.player1.username) {
				playerLeftResult.classList.add('win');
				playerRightResult.classList.add('lost');
			}
			else {
				playerLeftResult.classList.add('lost');
				playerRightResult.classList.add('win');
			}
			Matchline.prepend(playerLeftResult);
			Matchline.appendChild(playerRightResult);
		}
	});
}


function setFlappyHistoric (games) {
	
    if (!Array.isArray(games)) {
        console.error("Invalid data: 'games' should be an array", games);
        return;
	}
    games.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

	const matchList = document.getElementById("matchList");

	games.forEach(game => {
		const Matchline = document.createElement('div');
		Matchline.classList.add('Matchline');
		// Matchline.classList.add("text");
		matchList.appendChild(Matchline);

		const playerLine = document.createElement('div');
		playerLine.classList.add('playerLine');

		const player1block = document.createElement('div');
		player1block.classList.add('player-left');
		player1block.textContent = `${game.player1.username}`

		const player2block = document.createElement('div');
		player2block.classList.add('player-right');
		player2block.textContent = `${game.player2.username}`

		Matchline.appendChild(player1block);
		Matchline.appendChild(player2block);

		const playerLeftResult = document.createElement('div');
		const playerRightResult = document.createElement('div');
		if (game.winner != null) {
			if(game.winner.username == game.player1.username) {
				playerLeftResult.classList.add('win');
				playerRightResult.classList.add('lost');
			}
			else {
				playerLeftResult.classList.add('lost');
				playerRightResult.classList.add('win');
			}
			Matchline.prepend(playerLeftResult);
			Matchline.appendChild(playerRightResult);
		}
	});
}

async function getPongHistoric(id) {

	console.log("id =", id);

	let games = null;
	if (id) {
		const response = await fetch(config.backendUrl + '/user/games/' + id, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include'
		});
		const data = await response.json();
		if (response.status !== 200) {
			console.error('Error connecting to user game history');
			customalert('Error', data.error, true);
			router.navigate('/');
		}
		games = data;
	}
	console.log(games);
	if (games)
		setPongHistoric(games.games);
}

async function getFlappyHistoric(id) {

	let games = null;
	if (id) {
		const response = await fetch(config.backendUrl + '/user/flappy/games/' + id, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include'
		});
		const data = await response.json();
		if (response.status !== 200) {
			console.error('Error connecting to user game history');
			customalert('Error', data.error, true);
			router.navigate('/');
		}
		games = data;
	}
	console.log(games);
	if (games)
		setFlappyHistoric(games.games);
}
