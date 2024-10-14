
import { getCookie } from '../../components/storage/script.js';
import { get_user } from '../../components/user/script.js';
import { login, register } from '../components/user/script.js';
import {customalert} from '../components/alert/script.js'

const loginPopin = document.getElementById("login-popin");
const logoutPopin = document.getElementById("logout-popin");

let userElement = document.querySelector('#user_username');

let isConnected = false;
let userCookie = getCookie('user');

if (userCookie)
{
	const user = JSON.parse(userCookie);
    // userElement.innerText = `${user.username} is connected`;
	isConnected = true;
}
await get_user();

	if (userCookie)
	{
		const user = JSON.parse(userCookie);
		isConnected = true;
		loginPopin.style.display = 'none';
		logoutPopin.style.display = "flex";
		logoutPopin.className = "log-buttons";
		logoutPopin.fontFamily = "isaac";
		logoutPopin.innerText = `LOGGED AS ${user.username}`;
	}
	else
	{
		
		loginPopin.style.display = 'flex';
		isConnected = false;
	}

const popin = document.getElementById("popin");
const openPopupBtn = document.getElementById("login");
const closePopupBtn = document.getElementById("closePopupBtn");

openPopupBtn.addEventListener("click", function() {
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

const registerPopin = document.getElementById("register-content");
// const loginPopin = document.getElementById("login-content");

const openPopinBtn = document.getElementById("register-button");
const closePopinBtn = document.getElementById("closePopupBtn");

openPopinBtn.addEventListener("click", function() {
    popin.style.display = "flex"; // Make the popup visible
});

closePopinBtn.addEventListener("click", function() {
	popin.style.display = "none";
});

window.addEventListener("click", function(event) {
	if (event.target === popin) {
		popin.style.display = "none";
    }
});


openPopinBtn.addEventListener('click', function (event) {
	loginPopin.style.display = "none";
	registerPopin.style.display = "flex";
});


const submitLoginButton = document.getElementById("submit-login");
const submitRegisterButton = document.getElementById("submit-register");

const logindiv = document.getElementById("login-content");
const loginform = logindiv.querySelector('form');

loginform.addEventListener('submit', login_form);

async function login_form(event) {
	event.preventDefault();
	
	const email = document.querySelector('input[name="email"]').value;
	const password = document.querySelector('input[name="password"]').value;
	
	const popinLogin = document.getElementById("login-popin");
	const popinLogout = document.getElementById("logout-popin");
	
	const response = await login(email, password);
	
	console.log('Response Status:', response.status);
	
	if (response.status === 200) {
		customalert('Login successful', 'You are now logged in');
		popinLogin.style.display = "none";
		popinLogout.style.display = "flex";
		popin.style.display ="none";
		popinLogout.textContent = 'LOGGED AS ';
		displayUsername(username);

	}
	else {
		const data = await response.json();
		customalert('Login failed', data.error, true);
	}
}

const registerDiv = document.getElementById("register-content");
const registerForm = registerDiv.querySelector('form');
registerForm.addEventListener('submit', register_form);

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
		registerPopin.style.display = "none";
		popinLog.style.display = 'flex'; 

	}
	else {
		const data = await response.json();
		customalert('Error', data.error, true);
	}
}

// const logoutButton= document.getElementById("logout");

// logoutButton.addEventListener("click", function() {
    
// });