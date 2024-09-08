import { register } from "../../components/user/script.js";

const form = document.querySelector('.signup form');
form.addEventListener('submit', register_form);

async function register_form(event)
{
	event.preventDefault();
	const username = document.querySelector('input[name="txt"]').value;
	const email = document.querySelector('input[name="email"]').value;
	const password = document.querySelector('input[name="pswd"]').value;

	const response = await register(username, email, password);

	if (response.status === 201)
		window.location.href = '/';
	else
		alert('Registration failed');
}
