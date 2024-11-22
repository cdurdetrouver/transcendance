import { customalert } from '../../components/alert/script.js';
import config from '../../env/config.js';
import { get_user, logout, update_user, update_password } from '../../components/user/script.js';
import { router } from '../../app.js';
import { handleDeleteAccount  } from '../../routes/user/edit/script.js';
import { deleteCookie, setCookie } from '../../../components/storage/script.js';


// async function get_games(user_id) {
// 	const response = await fetch(config.backendUrl + '/user/games/' + user_id, {
// 		method: 'GET',
// 		headers: {
// 			'Content-Type': 'application/json'
// 		},
// 		credentials: 'include'
// 	});
// 	if (response.status !== 200) {
// 		console.error('Error connecting to user');
// 		customalert('Error', 'Error get games for user', true);
// 		return null;
// 	}
// 	const games = await response.json();
// 	console.log(games);
// 	return games.games;
// }

// function addGame(player1, player1_score, player2, player2_score) {
// 	const game_list = document.querySelector('.game-list');
// 	const game = document.createElement('li');

// 	game.innerHTML = `
// 		<div class="game-info">
// 			<div>${player1.username}</div>
// 			<div class="score">${player1_score} - ${player2_score}</div>
// 			<div>${player2.username}</div>
// 		</div>
// 	`;
// 	game_list.appendChild(game);
// }

function setPersonalUser(user) {
	const username = user.username;
	const email = user.email;
	// const profilePicture = user.pictureRemote ? user.pictureRemote : config.backendUrl + user.profilePicture;
	const profilePicture = user.picture_remote ? user.picture_remote : config.backendUrl + user.profile_picture;

	var profilePictureContainer = document.querySelector("#profile-picture");

	if (profilePictureContainer) {
		console.log("profile exist");

		// var image = document.createElement("img");
		let imgElement = document.querySelector('#profile-picture img');
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

	// const games = await get_games(id || me.id);
	// if (!games)
	// 	router.navigate('/');
	// for (const game of games) {
	// 	addGame(game.player1, game.player1_score, game.player2, game.player2_score);
	// }

	if (user)
		setUser(user.user);
	else
		setPersonalUser(me);
}

document.getElementById("edit-password").addEventListener('submit', handleFormPassword);
document.getElementById("username-form").addEventListener('submit', handleFormUsername);
document.querySelector("#profile-picture-container").addEventListener('change', handleFormProfilePicture);

const editProfileButton = document.querySelector("#edit-profile .buttons");
const editProfilePicture = document.querySelector("#edit-profile button");
const password = document.querySelector("#edit-password");

editProfileButton.addEventListener("click", function() {
	console.log("edit profile");
	editUsernameButton.style.display = "flex";
	password.style.display = "flex";
	editProfilePicture.style.display = "flex";
});

editProfilePicture.addEventListener("click", function() {
	console.log("bonjour");
	document.querySelector("#profile-picture-container input").click();
});

async function handleFormProfilePicture(event) {
	console.log("EDIT PROFILE PICTURE");

	event.preventDefault();
	const form = document.querySelector("#profile-picture-container form");
	const formData = new FormData(form);
	console.log(formData);
	let response = await update_user(formData);

	try {
        let response = await update_user(formData);
        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        let data = await response.json();
        if (response.status === 200) {
            customalert('Success', 'User updated successfully', false);
            setPersonalUser(data.user);
            deleteCookie('user');
            setCookie('user', JSON.stringify(data.user), 5 / 1440);
        } else {
            customalert('Error', data.error || 'Unknown error', true);
        }
    }
	catch (error) {
        console.error("Error during the request: ", error);
        customalert('Error', error.message || 'An error occurred while updating the profile picture.', true);
    }
}

const editUsernameButton = document.querySelector("#username button")
const usernameForm = document.querySelector("#username form");
const labelUsername = document.querySelector("#username .label");

editUsernameButton.addEventListener("click", function() {
	console.log("edit username");
	
	labelUsername.style.display = "none";
	editUsernameButton.style.display = "none";
	usernameForm.style.display = "flex";
});

async function changeDisplayUsername() {
	labelUsername.style.display = "flex";
	editUsernameButton.style.display = "flex";
	usernameForm.style.display = "none";
}

async function handleFormUsername(event) {
	console.log("EDIT USERNAME");

	event.preventDefault();
	const form = document.querySelector("#username-form")
	const formData = new FormData(form);
	console.log(formData);
	let response = await update_user(formData);
	if (response.status === 200) {
		customalert('Success', 'User updated successfully', false);
		let data = await response.json();
		setPersonalUser(data.user);
		deleteCookie('user');
		setCookie('user', JSON.stringify(data.user), 5 / 1440);
		changeDisplayUsername();
	}
	else {
		let data = await response.json();
		customalert('Error', data.error, true);
	}
}

const editPasswordButton = document.querySelector("#edit-password .edit-button");
const editPassword = document.querySelector("#edit-password form");
const labelPassword = document.querySelector("#edit-password  .label");

editPasswordButton.addEventListener("click", function() {
	console.log("edit password");
	labelPassword.style.display = "none";
	editPasswordButton.style.display = "none";
	editPassword.style.display = "flex";
});

async function changeDisplayPassword() {
	// inputPassword.style.display = "flex";
	editPasswordButton.style.display = "flex";
	editPassword.style.display = "none";
}


async function handleFormPassword(event) {
	console.log("EDIT PASSWORD");

	event.preventDefault();
	const form = document.querySelector("#edit-password form");
	const formData = new FormData(form);

	const newPassword = document.querySelector('input[name="new-password"]').value;
	const confirmPassword = document.querySelector('input[name="confirm-password"]').value;

	if (newPassword !== confirmPassword) {
		console.log("password do not match");
		customalert('Error', 'Password do not match.', true);
		return
	}

	let response = await update_password(formData);

	if (response.status === 200) {
		customalert('Success', 'Password updated successfully', false);
		// let data = await response.json();
		// setPersonalUser(data.user);
		// deleteCookie('user');
		// setCookie('user', JSON.stringify(data.user), 5 / 1440);
		changeDisplayPassword();
	}
	else {
		let data = await response.json();
		customalert('Error', data.error, true);
	}
}

const deleteButton = document.querySelector("#delete-profile .buttons");
const confirmationPopin = document.getElementById("confirmation-popin");
const yesButton = document.getElementById("yes-button");
const noButton = document.getElementById("no-button");
const logoutButton = document.getElementById("logout-button");

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

