
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
const account = document.querySelector("#account");

function enableAccount() {
	account.classList.remove("disabled-link");
}

async function getProfilePicture() {
	let user = await get_user();
	let profilePicture = user.picture_remote ? user.picture_remote : config.backendUrl + user.profile_picture;
	let imgElement = document.querySelector("#login-container img");
	imgElement.src = profilePicture;
}

let userCookie = getCookie('user');

await get_user();

if (userCookie) {
	loginPopin.style.display = "none";
	getProfilePicture();
	enableAccount();
}

else {
	loginPopin.style.display = "flex";
}


loginButton.addEventListener("click", function() {
	console.log("login button");
    popin.style.display = "flex";
});
const closeButton = document.querySelector("#close-button");

closeButton.addEventListener("click", function() {
	console.log("close button");
    popin.style.display = "none";
});

// window.addEventListener("click", function(event) {
//     if (event.target === popin) {
//         popin.style.display = "none";
//     }
// });

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
	
	const response = await login(email, password);
	
	console.log('Response Status:', response.status);
	
	if (response.status === 200) {
		console.log("login success");
		customalert('Login successful', 'You are now logged in');
		loginPopin.style.display = "none";
		// logoutPopin.style.display = "flex";
		popin.style.display = "none";
		enableAccount()
		await getProfilePicture();
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
const avatar = document.querySelector(".avatar");
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
		enableAccount();
		await getProfilePicture();
	}
	else {
		const data = await response.json();
		customalert('Error', data.error, true);
	}
}

