import { customalert } from '../../components/alert/script.js';
import config from '../../env/config.js';
import { get_user, logout, update_user, update_password } from '../../components/user/script.js';
import { router } from '../../app.js';
import { handleDeleteAccount  } from '../../routes/user/edit/script.js';

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

function setPersonalUser(user) {
	const username = user.username;
	const email = user.email;
	const profilePicture = user.picture_remote ? user.picture_remote : config.backendUrl + user.profile_picture;

	var profilePictureContainer = document.querySelector("#profile-picture");

	if (profilePictureContainer) {
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
			customalert('Error', 'Error get user', true);
			router.navigate('/');
		}
		user = await response.json();
	}
	if (user)
		setPersonalUser(user.user);
	else
		setPersonalUser(me);
}

const blockButton = document.querySelector("#block-user .buttons");
const confirmationPopin = document.getElementById("confirmation-popin");
const yesButton = document.getElementById("yes-button");
const noButton = document.getElementById("no-button");
const logoutButton = document.getElementById("logout-button");

blockButton.addEventListener("click", function() {
	confirmationPopin.style.display = "flex";
});

yesButton.addEventListener("click", function() {
	confirmationPopin.style.display = "none";
	//block user function
});

noButton.addEventListener("click", function() {
	confirmationPopin.style.display = "none";
});

logoutButton.addEventListener("click", function() {
	logout();
	router.navigate('/');
});
