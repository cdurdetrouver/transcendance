import { getCookie } from '../components/storage/script.js';
import { get_user } from '../components/user/script.js';
import { login, register } from '../components/user/script.js';
import {customalert} from '../components/alert/script.js';
import config from '../env/config.js';


const ButtonGoogle = document.querySelector("#google");
ButtonGoogle.href = `https://accounts.google.com/o/oauth2/auth?client_id=${config.google_id}&redirect_uri=${encodeURIComponent(config.frontendUrl + '/login?source=google')}&response_type=code&scope=openid%20email%20profile`;
const ButtonGithub = document.querySelector("#github");
ButtonGithub.href = `https://github.com/login/oauth/authorize?client_id=${config.github_id}&redirect_uri=${encodeURIComponent(config.frontendUrl + '/login?source=github')}&scope=user`;
const ButtonIntra = document.querySelector("#intra");
ButtonIntra.href = `https://api.intra.42.fr/oauth/authorize?client_id=${config.intra_client_id}&redirect_uri=${encodeURIComponent(config.frontendUrl + '/login')}&response_type=code`;

const loginPopin = document.querySelector("#login-container button");
const loginButton = document.querySelector("#login-container button");
const popin = document.querySelector("#popin-container");
let isLoggedIn = false;

async function getProfilePicture(user) {
	let profilePicture = user.picture_remote ? user.picture_remote : config.backendUrl + user.profile_picture;
	let imgElement = document.querySelector("#login-container img");
	imgElement.src = profilePicture;
}

const accountButton = document.querySelector("#account");
const onlineButton = document.querySelector("#online");
const chatButton = document.querySelector("#chat");

function updateButtonState(button) {
	if (isLoggedIn) {
		console.log("update");
		button.classList.remove("disabled");
	}
	else {
		button.classList.add("disabled");
	}
}

accountButton.addEventListener("click", function(event) {
	if (!isLoggedIn) {
		customalert("Error", "Please login", 1);
		event.preventDefault();
	}
});

onlineButton.addEventListener("click", function(event) {
	if (!isLoggedIn) {
		customalert("Error", "Please login", 1);
		event.preventDefault();
	}
});

chatButton.addEventListener("click", function(event) {
	if (!isLoggedIn) {
		customalert("Error", "Please login", 1);
		event.preventDefault();
	}
});

loginButton.addEventListener("click", function() {
	console.log("login button");
    popin.style.display = "flex";
});
const closeButton = document.querySelector("#close-button");

closeButton.addEventListener("click", function() {
	console.log("close button");
    popin.style.display = "none";
});

const loginForm = document.querySelector("#login-content");
const registerForm = document.querySelector("#register-content");
const registerButton = document.querySelector("#login-content button");

registerButton.addEventListener('click', function () {
	console.log("register button");
	loginForm.style.display = "none";
	registerForm.style.display = "flex";
	document.querySelector("#title").innerHTML = "REGISTER";
});

//LOGIN
const loginSubmit = loginForm.querySelector('form');
loginSubmit.addEventListener('submit', login_form);

async function login_form(event) {
	event.preventDefault();
	
	const email = document.querySelector('input[name="email"]').value;
	const password = document.querySelector('input[name="password"]').value;
	
	console.log(email, password);
	
	const response = await login(email, password);
	
	console.log('Response Status:', response.status);
	
	if (response.status === 200) {
		console.log("login success");
		customalert('Login successful', 'You are now logged in');
		loginPopin.style.display = "none";
		popin.style.display = "none";
		initComponent();
	}
	else {
		const data = await response.json();
		customalert('Login failed', data.error, true);
	}
}

//REGISTER
const registerSubmit = registerForm.querySelector("form");


const fileInput = document.getElementById('chk');
const fileChosen = document.getElementById('file-chosen');
const avatar = document.querySelector("#avatar");
const backToLogin = document.querySelector("#back-to-login");



backToLogin.addEventListener("click", function() {
	registerForm.style.display = "none";
	loginForm.style.display = "flex";
	document.querySelector("#title").innerHTML = "LOGIN";

});

fileInput.addEventListener('change', function() {
	fileChosen.textContent = this.files[0].name;
	avatar.style.backgroundImage = "url(../static/assets/login/avatar_happy.png)";
});

registerSubmit.addEventListener("submit", register_form);

async function register_form(event) {
	event.preventDefault();
	
	
	const username = document.querySelector('input[name="username"]').value;
	const email = document.querySelector('input[name="email"]').value;
	const password = document.querySelector('input[name="password-register"]').value;
	const confirmPassword = document.querySelector('input[name="confirm-password"]').value;
	const profilePicture = document.querySelector('input[name="profile-picture"]').files[0];

	if (password !== confirmPassword) {
		console.log("password", password);
		console.log("confirm password", confirmPassword, "cc");
		customalert('Error', 'Password do not match.', true);
		return
	}

	const response = await register(username, email, password, profilePicture);

	if (response.status === 201) {
		console.log("register success");
		customalert('Registration successful', 'You are now registered');
		registerForm.style.display = "none";
		loginPopin.style.display = "none";
		// logoutPopin.style.display = "flex";
		popin.style.display = "none";
		loginForm.style.display = "flex";
		getProfilePicture();//ca marche pas je dois refresh pou avoir la photo de profil
		initComponent();
	}
	else {
		const data = await response.json();
		customalert('Error', data.error, true);
	}
}

export async function initComponent() {
	const user = await get_user();

	if (user) {
		loginPopin.style.display = "none";
		isLoggedIn = true;
		getProfilePicture(user);
		updateButtonState(accountButton);
		updateButtonState(onlineButton);
		updateButtonState(chatButton);
		const button_qr_code = document.getElementById('gen-qrcode');
		button_qr_code.addEventListener('click', getQrcode);

		const button_verify_2fa = document.getElementById('verify-2fa');
		button_verify_2fa.addEventListener('click', enable2FA);
	}
	else {
		loginPopin.style.display = "flex";
	}
}


const qrcode = document.querySelector("#qrcode");
const qrcodePopin = document.querySelector("#qrcode-content");

qrcode.addEventListener("click", function() {
	loginPopin.style.display = "none";
	loginForm.style.display = "none";
	qrcodePopin.style.display = "flex";
});

export async function cleanupComponent() {
	//remove envent listener

}
