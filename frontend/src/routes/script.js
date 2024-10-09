
import { getCookie } from '../../components/storage/script.js';
import { get_user } from '../../components/user/script.js';
import { login, register } from '../components/user/script.js';

import {customalert} from '../components/alert/script.js'


const popup = document.getElementById("popin");
const openPopupBtn = document.getElementById("login");
const closePopupBtn = document.getElementById("closePopupBtn");

openPopupBtn.addEventListener("click", function() {
    popup.style.display = "flex"; // Make the popup visible
});

closePopupBtn.addEventListener("click", function() {
    popup.style.display = "none";
});

window.addEventListener("click", function(event) {
    if (event.target === popup) {
        popup.style.display = "none";
    }
});

const registerPopin = document.getElementById("register-content");
const loginPopin = document.getElementById("login-content");

const openPopinBtn = document.getElementById("register-button");
const closePopinBtn = document.getElementById("closePopupBtn");

openPopinBtn.addEventListener("click", function() {
    popup.style.display = "flex"; // Make the popup visible
});

closePopinBtn.addEventListener("click", function() {
	popup.style.display = "none";
});

window.addEventListener("click", function(event) {
	if (event.target === popup) {
		popup.style.display = "none";
    }
});

let userElement = document.querySelector('user-info');

openPopinBtn.addEventListener('click', function (event) {
	loginPopin.style.display = "none";
	registerPopin.style.display = "flex";
});

document.addEventListener("DOMContentLoaded", () => {

	const submitLoginButton = document.getElementById("submit-login");
	const submitRegisterButton = document.getElementById("submit-register");

	const logindiv = document.getElementById("login-content");
	const loginform = logindiv.querySelector('form');
	const localButton = document.getElementById("local");
	const loginButton = document.getElementById("login");
	console.log(loginButton);

	let isLoggedIn = false;

	loginform.addEventListener('submit', login_form);

	async function login_form(event) {
		event.preventDefault();

		const email = document.querySelector('input[name="email"]').value;
		const password = document.querySelector('input[name="password"]').value;

		// console.log(email, password);

		const response = await login(email, password);

		console.log('Response Status:', response.status);

		if (response.status === 200) {
			// router.navigate(href);
			customalert('Login successful', 'You are now logged in');
			localButton.disabled = false;
			loginButton.textContent = 'LOGOUT';
			isLoggedIn = true;
			console.log('Login Button text changed to:', loginButton.textContent);
		}
		else {
			const data = await response.json();
			customalert('Login failed', data.error, true);
			
		}
	}

	loginButton.addEventListener('click', () => {
		if (isLoggedIn) {
			customalert('Logout successful', 'You are now logged out');
			localButton.disabled = true; // Désactiver le bouton local
			loginButton.textContent = 'LOGIN'; // Changer le texte du bouton
			isLoggedIn = false; 
		} else {
			// Si l'utilisateur n'est pas connecté, ouvrir la popin de connexion
			const popin = document.getElementById('popin');
			popin.style.display = 'flex'; // Afficher la popin
		}
	});
});

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

	}
	else {
		const data = await response.json();
		customalert('Error', data.error, true);
	}
}