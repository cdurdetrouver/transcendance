import { router } from "../../../app.js";
import { customalert } from "../../../components/alert/script.js";
import { get_user } from "../../../components/user/script.js";
import config from "../../../env/config.js";

async function navigate_to_game(game_id) {
	const response = await fetch(config.backendUrl + `/pong/games/${game_id}/`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
		credentials: 'include'
	});
	if (response.status === 200) {
		const data = await response.json();
		const room_name = data.game.room_name;
		const id = data.game.id;
		router.navigate(`/pong/game?game_room=${room_name}&game_id=${id}`);
	}
	else
		console.error('Error connecting to game');
}

function addGame(player1, player1_score, player2, player2_score, game_id, nb_viewers) {
	const game_list = document.querySelector('.game-list');
	const game = document.createElement('li');
	game.innerHTML = `
		<div class="game-info">
			<div>${player1.username}</div>
			<div class="score">${player1_score} - ${player2_score}</div>
			<div>${player2.username}</div>
		</div>
		<div class="viewers">
			${nb_viewers}
			<span class="viewers-icon">👁️</span>
		</div>
		<a href="#" class="show-game" data-game-id="${game_id}">
			Show
			<span class="play-icon">▶️</span>
		</a>
	`;
	game_list.appendChild(game);
}

async function get_all_game() {
	const response = await fetch(config.backendUrl + '/pong/games/', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
		credentials: 'include'
	});

	if (response.status === 200) {
		const games = await response.json();
		if (games.games.length === 0) {
			customalert('Error', 'No games found', true);
			return;
		}
		for (const game of games.games) {
			addGame(game.player1, game.player1_score, game.player2, game.player2_score, game.id, game.nb_viewers);
		}
		document.querySelectorAll('.show-game').forEach(anchor => {
			anchor.addEventListener('click', function (event) {
				event.preventDefault();
				const gameId = this.getAttribute('data-game-id');
				navigate_to_game(gameId);
			});
		});
	} else {
		console.error('Error connecting to games');
	}
}

async function refresh() {
	const game_list = document.querySelector('.game-list');
	game_list.innerHTML = '';

	const response = await fetch(config.backendUrl + '/pong/games/', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
		credentials: 'include'
	});

	if (response.status === 200) {
		const games = await response.json();
		if (games.games.length === 0) {
			customalert('Error', 'No games found', true);
			return;
		}
		for (const game of games.games) {
			addGame(game.player1, game.player1_score, game.player2, game.player2_score, game.id);
		}
	} else {
		console.error('Error connecting to games');
	}
}

export async function initComponent() {
	await new Promise((resolve, reject) => setTimeout(resolve, 100));
	const user = await get_user();
	if (!user) {
		customalert('Error', 'You are not logged in', true);
		router.navigate('/');
	}
	else
		await get_all_game();
}