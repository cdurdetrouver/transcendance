import { customalert } from '../../components/alert/script.js';
import config from '../../env/config.js';
import { get_user, logout } from '../../components/user/script.js';
import { router } from '../../app.js';
import { handleDeleteAccount  } from '../../routes/user/edit/script.js';

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
	const username = user.username;
	const email = user.email;
	// const profilePicture = user.pictureRemote ? user.pictureRemote : config.backendUrl + user.profilePicture;
	const profilePicture = user.picture_remote ? user.picture_remote : config.backendUrl + user.profile_picture;

	var profilePictureContainer = document.getElementById("profile-picture-container");

	if (profilePictureContainer) {
		console.log("profile exist");

		// var image = document.createElement("img");
		let imgElement = document.querySelector('#profile-picture');
		imgElement.src = profilePicture;

	}
	else {
		console.log("user infos does not exist");
	}
	const usernameInfo = document.querySelector("#username .label");
	const emailInfo = document.querySelector("#email .label");


	usernameInfo.textContent = username;
	emailInfo.textContent = email;

}

function setUser(user) {
	const userDiv = document.querySelector('.container');
	const username = user.username;
	const email = user.email;
	const profilePicture = user.pictureRemote ? user.pictureRemote : config.backendUrl + user.profilePicture;
	const userHtml = `
		<div class="user__info">
			<p class="user__info__username">${username}</p>
			<p class="user__info__email">${email}</p>
			<img src="${profilePicture}" alt="Profile Picture">
		</div>
	`;
	userDiv.innerHTML = userHtml;
}

export async function initComponent() {
	let me = await get_user();
	if (!me) {
		customalert('Error', 'You are not logged in', true);
		router.navigate('/login?return=/user');
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
			customalert('Error', 'Error get user', true);
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

const currentInfo = document.getElementById("current-info");
const userInfo = document.getElementById("user-info");
const editInfo = document.getElementById("edit-info");
const editProfileButton = document.getElementById("edit-profile-button");
const editUsername = document.getElementById("edit-username");
const editEmail = document.getElementById("edit-email");
const deleteButton = document.getElementById("delete-button");
const confirmationPopin = document.getElementById("confirmation-popin");
const yesButton = document.getElementById("yes-button");
const noButton = document.getElementById("no-button");
const logoutButton = document.getElementById("logout-button");
const editPasswordButton = document.getElementById("edit-password-button");
const password = document.getElementById("password");
const editUsernameButton = document.getElementById("edit-username-button");

editProfileButton.addEventListener("click", function() {
	editUsernameButton.style.display = "flex";
	password.style.display = "flex";
});

editEmail.addEventListener("click", function() {
	console.log("edit email");

});

deleteButton.addEventListener("click", function() {
	console.log("delete button");
	// handleDeleteAccount();
	confirmationPopin.style.display = "flex";
});


yesButton.addEventListener("click", function() {
	console.log("yes button");
	confirmationPopin.style.display = "none";
	handleDeleteAccount();

});

noButton.addEventListener("click", function() {
	console.log("no button");
	confirmationPopin.style.display = "none";
});

logoutButton.addEventListener("click", function() {
	console.log("logout button");
	logout();
	// disabledAccount();
});

