import { customalert } from '../../components/alert/script.js';
import config from '../../env/config.js';
import { get_user, logout, update_user, update_password } from '../../components/user/script.js';
import { router } from '../../app.js';
import { handleDeleteAccount  } from '../../routes/user/edit/script.js';
import { deleteCookie, setCookie } from '../../../components/storage/script.js';
import { getQrcode, enable2FA } from '../user/2FA/script.js';

function displayUser(user)
{
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


function setPersonalUser(user) {
	displayUser(user);
}


function setUser(user, inviteOrEditButton, blockOrDeleteButton, twofaOrAddFriend) {
	displayUser(user);

	inviteOrEditButton.textContent = "INVITE TO CHAT";
	document.querySelector("#edit-logo-left").src = "../../static/assets/header/chat.png"
	document.querySelector("#edit-logo-right").src = "../../static/assets/header/chat.png"
	blockOrDeleteButton.textContent = "BLOCK USER";
	twofaOrAddFriend.textContent = "ADD FRIEND";
	document.querySelector("#label-email").style.display = "none";
	document.querySelector(".label").style.display = "none";
	document.querySelector("#who span").textContent = "THEM";
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

	var twofa;

	const inviteOrEditButton = document.querySelector("#edit-profile span");
	const blockOrDeleteButton = document.querySelector("#delete-profile span");
	const twofaOrAddFriend = document.querySelector("#friend-or-2fa span");

	if (user)
		setUser(user.user, inviteOrEditButton, blockOrDeleteButton, twofaOrAddFriend);
	else
		setPersonalUser(me);

	document.getElementById("edit-password").addEventListener('submit', handleFormPassword);
	document.getElementById("username-form").addEventListener('submit', handleFormUsername);
	document.querySelector("#profile-picture-container").addEventListener('change', handleFormProfilePicture);
	
	const editProfilePicture = document.querySelector("#profile-picture-container label");
	const password = document.querySelector("#edit-password");
	
	inviteOrEditButton.addEventListener("click", function() {
		if (id) {
			console.log("invite to chat");
	
		}
		else {
			console.log("edit profile");
			editUsernameButton.style.display = "flex";
			password.style.display = "flex";
			editProfilePicture.style.display = "flex";
		}
	});
	
	editProfilePicture.addEventListener("click", function() {
			document.querySelector("#profile-picture-container input").click();
	});
	const popin = document.getElementById("popin");
	const yesButton = document.getElementById("yes-button");
	const noButton = document.getElementById("no-button");
	const logoutButton = document.getElementById("logout-button");
	const qrcodeContent = document.getElementById("qrcode-content");
	const confirmationContent = document.getElementById("confirmation-content");
	const generateQrcode = document.querySelector("#generate-qrcode");

	blockOrDeleteButton.addEventListener("click", function() {
		console.log("delete button");
		popin.style.display = "flex";
	});

	twofaOrAddFriend.addEventListener("click", function() {
		popin.style.display = "flex";
		document.querySelector("#confirmation-content span").textContent = "Activate 2FA?";
		twofa = true;
	});

	yesButton.addEventListener("click", function() {
		if (!twofa) {
			deleteOrBlock(id, popin);
		}
		else {
			confirmationContent.style.display = "none";
			qrcodeContent.style.display = "flex";
		}
	});

	noButton.addEventListener("click", function() {
		popin.style.display = "none";
	});
	
	generateQrcode.addEventListener("click", function() {
		getQrcode();
	});

	logoutButton.addEventListener("click", function() {
		console.log("logout button");
		logout();
		router.navigate('/');
	});

	const editPasswordButton = document.querySelector("#edit-password .edit-button");
	const editPassword = document.querySelector("#edit-password form");
	const labelPassword = document.querySelector("#edit-password  .label");

	editPasswordButton.addEventListener("click", function() {
		console.log("edit password");
		labelPassword.style.display = "none";
		editPasswordButton.style.display = "none";
		editPassword.style.display = "flex";
	});

	const editUsernameButton = document.querySelector("#username button")
	const usernameForm = document.querySelector("#username form");
	const labelUsername = document.querySelector("#username .label");

	editUsernameButton.addEventListener("click", function() {
		console.log("edit username");
		
		labelUsername.style.display = "none";
		editUsernameButton.style.display = "none";
		usernameForm.style.display = "flex";
	});

}

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

async function changeDisplayPassword() {
	// inputPassword.style.display = "flex";
	editPasswordButton.style.display = "none";
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

// const deleteButton = document.querySelector("#delete-profile .buttons");

async function deleteOrBlock(id, popin) {
	try {
		popin.style.display = "none";
	
		if (id) {
			const response = await fetch(config.backendUrl + '/user/block/' + id + '/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include'
			});
			const data = await response.json();
			if (response.status !== 200) {
				customalert('Error', data.error, true);
				router.navigate('/');
				return;
			}
			customalert("Success", "User blocked", false)
			document.querySelector("#who span").textContent = "UGLY";
		}
		else {
			handleDeleteAccount();
		}
	}
	catch (error) {
		console.error("An error occurred:", error.message);
		customalert("Error", "An unexpected error occurred", true);
	}

};
