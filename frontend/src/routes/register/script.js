import { router } from "../../app.js";
import { register } from "../../components/user/script.js";

export async function initComponent() {
	const form = document.querySelector('.signup form');
	form.addEventListener('submit', register_form);
}

export async function cleanupComponent() {
	const form = document.querySelector('.signup form');
	form.removeEventListener('submit', register_form);
}

async function register_form(event) {
	event.preventDefault();
	const urlParams = new URLSearchParams(window.location.search);
	const return_path = urlParams.get('return');
	const href = return_path ?? '/';
	const username = document.querySelector('input[name="txt"]').value;
	const email = document.querySelector('input[name="email"]').value;
	const password = document.querySelector('input[name="pswd"]').value;
	const confirm_password = document.querySelector('input[name="pswd2"]').value;
	const profile_picture = document.querySelector('input[name="profilePicture"]').files[0];

	if (password !== confirm_password) {
		alert('Passwords do not match');
		return
	}

	const response = await register(username, email, password, profile_picture);

	if (response.status === 201)
		router.navigate(href);
	else
		alert('Registration failed');
}
