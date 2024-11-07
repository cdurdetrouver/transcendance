
import { getCookie, setCookie } from '../../components/storage/script.js';
import { get_user } from '../../components/user/script.js';
import { login, register, logout, login_tierce } from '../components/user/script.js';
import {customalert} from '../components/alert/script.js';
import config from '../env/config.js';
import { router } from '../app.js';

const ButtonGoogle = document.querySelector("#google");
ButtonGoogle.href = `https://accounts.google.com/o/oauth2/auth?client_id=${config.google_id}&redirect_uri=${encodeURIComponent(config.frontendUrl + '/login?source=google')}&response_type=code&scope=openid%20email%20profile`;
const ButtonGithub = document.querySelector("#github");
ButtonGithub.href = `https://github.com/login/oauth/authorize?client_id=${config.github_id}&redirect_uri=${encodeURIComponent(config.frontendUrl + '/login?source=github')}&scope=user`;
const ButtonIntra = document.querySelector("#intra");
ButtonIntra.href = `https://api.intra.42.fr/oauth/authorize?client_id=${config.intra_client_id}&redirect_uri=${encodeURIComponent(config.frontendUrl + '/login')}&response_type=code`;

const loginPopin = document.getElementById("popin-container");

const logoutPopin = document.querySelector("#logout button");
const loginButton = document.querySelector("#login button");
const closeButton = document.querySelector("#close-button");
const popin = document.querySelector("#popin-container");
const account = document.querySelector("#account");

function enableAccount() {
	account.classList.remove("disabled-link");
}

function disabledAccount() {
	account.classList.add("disabled-link");
}

let userCookie = getCookie('user');

await get_user();

if (userCookie) {
	const user = JSON.parse(userCookie);
	loginPopin.style.display = "none";
	logoutPopin.style.display = "flex";
	logoutPopin.className = "log-buttons";
	logoutPopin.fontFamily = "isaac";
	logoutPopin.innerHTML += `LOGGED AS ${user.username}`;
	enableAccount();
}

else {
	loginPopin.style.display = "flex";
}

loginButton.addEventListener("click", function() {
	console.log("login button");
    popin.style.display = "flex";
});

closeButton.addEventListener("click", function() {
    popin.style.display = "none";
});

window.addEventListener("click", function(event) {
    if (event.target === popin) {
        popin.style.display = "none";
    }
});

const loginForm = document.querySelector("#login-content");
const registerForm = document.querySelector("#register-content");
const registerButton = document.querySelector("#register-content .submit-button");

registerButton.addEventListener('click', function (event) {
	loginForm.style.display = "none";
	registerForm.style.display = "flex";
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
		logoutPopin.style.display = "flex";
		popin.style.display = "none";
		enableAccount()
	}
	else {
		const data = await response.json();
		customalert('Login failed', data.error, true);
	}
}

//REGISTER
const registerSubmit = registerForm.querySelector("form");
registerSubmit.addEventListener("submit", register_form);

async function register_form(event) {
	event.preventDefault();
	
	
	const username = document.querySelector('input[name="usernameRegister"]').value;
	const email = document.querySelector('input[name="emailRegister"]').value;
	const password = document.querySelector('input[name="passwordRegister"]').value;
	const confirmPassword = document.querySelector('input[name="confirmPasswordRegister"]').value;
	const profile_picture = document.querySelector('input[name="profilePicture').files[0];

	if (password !== confirmPassword) {
		customalert('Error', 'Password do not match.', true);
		return
	}

	const response = await register(username, email, password, profile_picture);

	if (response.status === 201) {
		console.log("register success");
		customalert('Registration successful', 'You are now registered');
		registerForm.style.display = "none";
		loginPopin.style.display = "none";
		logoutPopin.style.display = "flex";
		popin.style.display = "none";
		loginForm.style.display = "flex";
		enableAccount();
	}
	else {
		const data = await response.json();
		customalert('Error', data.error, true);
	}
}

//LOGOUT
const logoutButton= document.querySelector("#logout");
logoutButton.addEventListener("click", logoutUser);

async function logoutUser(event) {

	logout();
	loginPopin.style.display = 'flex';
	logoutPopin.style.display = 'none';
	disabledAccount();

}
