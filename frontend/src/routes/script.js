
import { getCookie } from '../../components/storage/script.js';
import { get_user } from '../../components/user/script.js';
import { login } from '../components/user/script.js';
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

// const register = document.getElementById("register-content");
// const login = document.getElementById("login-content");

const openPopinBtn = document.getElementById("register");
const closePopinBtn = document.getElementById("closePopupBtn");

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

let userElement = document.querySelector('user-info');

openPopinBtn.addEventListener('click', function (event) {
	login.style.display = "none";
	register.style.display = "flex";
});

const submitLoginButton = document.getElementById("submit-login");
const submitRegisterButton = document.getElementById("submit-register");

const logindiv = document.getElementById("login-content");
const loginform = logindiv.querySelector('form');
loginform.addEventListener('submit', login_form);

async function login_form(event) {
	event.preventDefault();
	// const urlParams = new URLSearchParams(window.location.search);
	// const return_path = urlParams.get('return');
	// const href = return_path ?? '/';
	const email = document.querySelector('input[name="username"]').value;
	const password = document.querySelector('input[name="password"]').value;

    console.log(email, password);

	const response = await login(email, password);

	if (response.status === 200) {
		// router.navigate(href);
		customalert('Login successful', 'You are now logged in');
	}
	else {
		const data = await response.json();
		customalert('Login failed', data.error, true);
	}
}