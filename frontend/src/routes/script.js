import { setCookie } from '../components/storage/script.js';
import { get_user } from '../components/user/script.js';
import { login, register } from '../components/user/script.js';
import {customalert} from '../components/alert/script.js';
import config from '../env/config.js';

let isLoggedIn;

export async function initComponent() {
	const user = await get_user();
	
	const accountButton = document.querySelector("#account");
	const onlineButton = document.querySelector("#online");
	const chatButton = document.querySelector("#chat");
	
	const ButtonGithub = document.querySelector("#github");
	const ButtonGoogle = document.querySelector("#google");
	const ButtonIntra = document.querySelector("#intra");
	
	const closeButton = document.querySelector("#close-button");
	
	const qrcodePopin = document.querySelector("#qrcode-content");
	const backFromQrcode = document.querySelector("#qrcode-content .back-to-login");
	
	const loginPopin = document.querySelector("#login-container button");
	const loginForm = document.querySelector("#login-content");
	const loginSubmit = document.querySelector("#default-login form");
	
	const registerForm = document.querySelector("#register-content");
	const registerButton = document.querySelector("#login-content button");
	const registerSubmit = registerForm.querySelector("form");
	const fileInput = document.getElementById('chk');
	const fileChosen = document.getElementById('file-chosen');
	const avatar = document.querySelector("#avatar");
	const backFromRegister = document.querySelector("#register-content .back-to-login");

	
	ButtonGithub.href = `https://github.com/login/oauth/authorize?client_id=${config.github_id}&redirect_uri=${encodeURIComponent(config.frontendUrl + '/login?source=github')}&scope=user`;
	ButtonIntra.href = `https://api.intra.42.fr/oauth/authorize?client_id=${config.intra_client_id}&redirect_uri=${encodeURIComponent(config.frontendUrl + '/login')}&response_type=code`;
	ButtonGoogle.href = `https://accounts.google.com/o/oauth2/auth?client_id=${config.google_id}&redirect_uri=${encodeURIComponent(config.frontendUrl + '/login?source=google')}&response_type=code&scope=openid%20email%20profile`;

	const loginButton = document.querySelector("#login-container button");
	const popin = document.querySelector("#popin-container");

	
	if (user) {
		console.log("user logged in");
		loginPopin.style.display = "none";
		isLoggedIn = true;
		getProfilePicture(user);
		updateButtonState(onlineButton, accountButton, chatButton, isLoggedIn);
		
	}
	else {
		console.log("user not logged in");
		// let imgElement = document.querySelector("#login-container img");
		// imgElement.src = "../static/assets/login/avatar_happy.png";
		isLoggedIn = false;
		loginPopin.style.display = "flex";
	}

	const urlParams = new URLSearchParams(window.location.search);
	const twofa_id = urlParams.get('2fa_id');
	if (twofa_id && !isLoggedIn) {
		popin.style.display = "flex";
		qrcodePopin.style.display = "flex";
		loginForm.style.display = "none";
		document.querySelector("#title").textContent = "2FA";
		document.querySelector("#submit-code").addEventListener("click", function() {
			form_2fa(twofa_id, loginPopin, qrcodePopin, popin);
		});
	}
	
	//BUTTONS

	accountButton.addEventListener("click", function(event) {
		if (!isLoggedIn) {
			customalert("Error", "Please login", 1);
			event.preventDefault();
			event.stopPropagation();

		}
	});

	onlineButton.addEventListener("click", function(event) {
		if (!isLoggedIn) {
			customalert("Error", "Please login", 1);
			event.preventDefault();
			event.stopPropagation();
		}
	});

	chatButton.addEventListener("click", function(event) {
		if (!isLoggedIn) {
			customalert("Error", "Please login", 1);
			event.preventDefault();
			event.stopPropagation();
		}
	});

	//LOGIN

	loginButton.addEventListener("click", function() {
		popin.style.display = "flex";
	});
	loginSubmit.addEventListener('submit', (event) => login_form(event, popin, loginPopin, loginForm, qrcodePopin));
	
	//REGISTER

	registerButton.addEventListener('click', function () {
		loginForm.style.display = "none";
		registerForm.style.display = "flex";
		document.querySelector("#title").innerHTML = "REGISTER";
	});
	
	backFromRegister.addEventListener("click", function() {
		registerForm.style.display = "none";
		loginForm.style.display = "flex";
		document.querySelector("#title").innerHTML = "LOGIN";

	});

	//QRCODE

	backFromQrcode.addEventListener("click", function() {
		qrcodePopin.style.display = "none";
		loginForm.style.display = "flex";
	});

	fileInput.addEventListener('change', function() {
		fileChosen.textContent = this.files[0].name;
		avatar.style.backgroundImage = "url(../static/assets/login/avatar_happy.png)";
	});

	registerSubmit.addEventListener("submit",  (event) => register_form(event, registerForm, loginPopin, popin, loginForm, user));

	closeButton.addEventListener("click", function() {
		popin.style.display = "none";
	});
}

function updateButtonState(onlineButton, accountButton, chatButton, isLoggedIn) {
	if (isLoggedIn) {
		onlineButton.classList.remove("disabled");
		accountButton.classList.remove("disabled");
		chatButton.classList.remove("disabled");
	}
	else {
		button.classList.add("disabled");
	}
}

async function getProfilePicture(user) {
	let profilePicture = user.picture_remote ? user.picture_remote : config.backendUrl + user.profile_picture;
	let imgElement = document.querySelector("#login-container img");
	imgElement.src = profilePicture;
}

async function login_form(event, loginPopin, popin, loginForm, qrcodePopin) {
	event.preventDefault();

	const email = document.querySelector('input[name="email-login"]').value;
	const password = document.querySelector('input[name="password"]').value;
	const response = await login(email, password);
	const data = await response.json();
	

	if (data.two_factor_enabled) {
		qrcodePopin.style.display = "flex";
		loginForm.style.display = "none";
		document.querySelector("#title").textContent = "2FA";
		document.querySelector("#submit-code").addEventListener("click", function() {
			console.log("2fa");
			form_2fa(data.user_id, loginPopin, qrcodePopin, popin);
		});
		return;
	}

	if (response.status === 200) {
		customalert('Login successful', 'You are now logged in');
		console.log("login successful");
		loginPopin.style.display = "none";
		popin.style.display = "none";
		initComponent();
	}
	else {
		customalert('Login failed', data.error, true);
	}
}

//REGISTER

async function register_form(event, registerForm, loginPopin, popin, loginForm, user) {
	event.preventDefault();
	
	const username = document.querySelector('input[name="username"]').value;
	const email = document.querySelector("#email-register").value;
	const password = document.querySelector('input[name="password-register"]').value;
	const confirmPassword = document.querySelector('input[name="confirm-password"]').value;
	const profilePicture = document.querySelector('input[name="profile-picture"]').files[0];

	if (password != confirmPassword) {
		customalert('Error', 'Password do not match.', true);
		return
	}

	const response = await register(username, email, password, profilePicture);

	if (response.status === 201) {
		customalert('Registration successful', 'You are now registered');
		registerForm.style.display = "none";
		loginPopin.style.display = "none";
		popin.style.display = "none";
		loginForm.style.display = "flex";
		getProfilePicture(user);
		initComponent();
	}
	else {
		const data = await response.json();
		customalert('Error', data.error, true);
	}
}

async function form_2fa(id, loginPopin, qrcodePopin, popin) {
	const token = document.querySelector(".qrcode input").value;

	const response = await fetch(config.backendUrl + '/user/verify-2fa/', {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			'token': token,
			'user_id': id
		}),
		credentials: "include",
	});
	console.log("id = ", id);
	if (response.status === 200) {
		const data = await response.json();
		setCookie('user', JSON.stringify(data.user), 5 / 1440);
		customalert('Login successful', 'You are now logged in');
		loginPopin.style.display = "none";
		qrcodePopin.style.display = "none";
		popin.style.display = "none";
		initComponent();
	}
	else {
		const data = await response.json();
		customalert('Login failed', data.error, true);
	}
	history.pushState({}, '', '/');

}

export async function cleanupComponent() {
	//remove envent listener

}
