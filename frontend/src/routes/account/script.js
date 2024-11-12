import { customalert } from '../../components/alert/script.js';
import config from '../../env/config.js';
import { get_user, logout, update_user } from '../../components/user/script.js';
import { router } from '../../app.js';
import { handleDeleteAccount  } from '../../routes/user/edit/script.js';
import { deleteCookie, setCookie } from '../../../components/storage/script.js';

document.getElementById("edit-password").addEventListener('submit', handleFormSubmit);
document.getElementById("edit-username").addEventListener('submit', handleFormSubmit);


async function handleFormSubmit(event) {
	console.log("salut");
	event.preventDefault();
	const form = event.target;
	const formData = new FormData(form);
	console.log(formData);
	let response = await update_user(formData);
	if (response.status === 200) {
		customalert('Success', 'User updated successfully', false);
		let data = await response.json();
		setPersonalUser(data.user);
		deleteCookie('user');
		setCookie('user', JSON.stringify(data.user), 5 / 1440);
	}
	else {
		let data = await response.json();
		customalert('Error', data.error, true);
	}
}

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
	const usernameInfo = document.querySelector("#username-label .label");
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


const confirmationPopin = document.getElementById("confirmation-popin");
const yesButton = document.getElementById("yes-button");
const noButton = document.getElementById("no-button");
const logoutButton = document.getElementById("logout-button");

const deleteButton = document.querySelector("#delete-profile .buttons");
const editProfileButton = document.querySelector("#edit-profile .buttons");
const password = document.querySelector("#password-label");
const editPasswordButton = document.querySelector("#password-label .edit-button");
const editUsernameButton = document.querySelector("#username-label .edit-button")
const editUsername = document.querySelector("#edit-username");
const editPassword = document.querySelector("#edit-password");
const editProfilePicture = document.querySelector("#edit-profile-picture");
// const editContainer = document.querySelector("#edit-info");

editProfileButton.addEventListener("click", function() {
	console.log("edit profile");
	editUsernameButton.style.display = "flex";
	password.style.display = "flex";
	editProfilePicture.style.display = "flex";
});

editPasswordButton.addEventListener("click", function() {
	console.log("edit password");
	document.querySelector("#password-label .label").style.display = "none";
	document.querySelector("#password-label .buttons").style.display = "none";
	editPassword.style.display = "flex";
	editPasswordButton.textContent = "BACK TO PROFILE";

});

editUsernameButton.addEventListener("click", function() {
	console.log("edit username");
	// username.style.display = "none";
	document.querySelector("#username-label .label").style.display = "none";
	document.querySelector("#username-label .edit-button").style.display = "none";
	// editContainer.style.display = "flex";
	editUsername.style.display = "flex";
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
	router.navigate('/');

	// disabledAccount();
});

