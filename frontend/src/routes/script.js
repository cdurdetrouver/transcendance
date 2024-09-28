import { get_user } from '../components/user/script.js';
import { customalert, clearalert } from '../components/alert/script.js';

export async function initComponent() {
	let user = await get_user();
	if (user)
		document.querySelector('#user_username').innerText = user.username;

	let buttonSucecs = document.querySelector('#button_success');
	buttonSucecs.addEventListener('click', () => {
		customalert('Success', 'This is a success message');
	});

	let buttonError = document.querySelector('#button_error');
	buttonError.addEventListener('click', () => {
		const delay = clearalert() ? 200 : 0;
		setTimeout(() => {
			customalert('Error', 'This is an error message', true);
		}, delay);
	});
}

const popup = document.getElementById("login-popin");
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



const register = document.getElementById("register-window");
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