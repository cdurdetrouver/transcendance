
import { getCookie } from '../../components/storage/script.js';
import { get_user } from '../../components/user/script.js';
import { login, register, logout } from '../components/user/script.js';
import {customalert} from '../components/alert/script.js'

const loginPopin = document.getElementById("login-popin");
const logoutPopin = document.getElementById("logout-popin");


let userElement = document.querySelector('#user_username');

let userCookie = getCookie('user');

if (userCookie) {
	const user = JSON.parse(userCookie);
}
await get_user();

if (userCookie) {
	console.log('TEST');
	const user = JSON.parse(userCookie);
	loginPopin.style.display = "none";
	logoutPopin.style.display = "flex";
	logoutPopin.className = "log-buttons";
	logoutPopin.fontFamily = "isaac";
	logoutPopin.innerHTML += `LOGGED AS ${user.username}`;
}
else {
	console.log("laaaa");
	loginPopin.style.display = "flex";

}

const popin = document.getElementById("popin");
const loginButton = document.getElementById("login");
const closePopupBtn = document.getElementById("closePopupBtn");

loginButton.addEventListener("click", function() {
    popin.style.display = "flex";
});

closePopupBtn.addEventListener("click", function() {
    popin.style.display = "none";
});

window.addEventListener("click", function(event) {
    if (event.target === popin) {
        popin.style.display = "none";
    }
});

const registerForm = document.getElementById("register-content");
const loginForm = document.getElementById("login-content");

const registerButton = document.getElementById("register-button");
const closePopinBtn = document.getElementById("closePopupBtn");

closePopinBtn.addEventListener("click", function() {
	popin.style.display = "none";
});

window.addEventListener("click", function(event) {
	if (event.target === popin) {
		popin.style.display = "none";
    }
});

registerButton.addEventListener('click', function (event) {
	loginForm.style.display = "none";
	registerForm.style.display = "flex";
});


const submitLoginButton = document.getElementById("submit-login");
const submitRegisterButton = document.getElementById("submit-register");

const logindiv = document.getElementById("login-content");
const loginSubmit = logindiv.querySelector('form');

loginSubmit.addEventListener('submit', login_form);

async function login_form(event) {
	event.preventDefault();
	
	const email = document.querySelector('input[name="email"]').value;
	const password = document.querySelector('input[name="password"]').value;
	
	// const popinLogin = document.getElementById("login-popin");
	// const popinLogout = document.getElementById("logout-popin");
	
	const response = await login(email, password);
	
	console.log('Response Status:', response.status);
	
	if (response.status === 200) {
		console.log("TEST ici");
		customalert('Login successful', 'You are now logged in');
		loginPopin.style.display = "none";
		logoutPopin.style.display = "flex";
		popin.style.display ="none";
		logoutPopin.className = "log-buttons";
		logoutPopin.fontFamily = "isaac";
		// logoutPopin.innerHTML += `LOGGED AS`;
		// logoutPopin.innerHTML += `LOGGED AS ${user.username}`;

	}
	else {
		const data = await response.json();
		customalert('Login failed', data.error, true);
	}
}

const registerDiv = document.getElementById("register-content");
const registerSubmit = registerDiv.querySelector('form');
registerSubmit.addEventListener('submit', register_form);

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
		customalert('Registration successful', 'You are now registered');
		loginPopin.style.display = "flex";
		registerForm.style.display = "none";
		popinLog.style.display = "flex";
		loginForm.style.display = "none";

	}
	else {
		const data = await response.json();
		customalert('Error', data.error, true);
	}
}

const logoutButton= document.getElementById("logout");


logoutButton.addEventListener("click", logoutUser);

async function logoutUser(event) {

	logout();
	loginPopin.style.display = 'flex';
	logoutPopin.style.display = 'none';

}
