import { login } from '../../components/user/script.js';

const form = document.querySelector('.login form');
form.addEventListener('submit', login_form);

async function login_form(event)
{
	event.preventDefault();
	const email = document.querySelector('input[name="email"]').value;
	const password = document.querySelector('input[name="pswd"]').value;

	const response = await login(email, password);

	if (response.status === 200)
		window.location.href = '/';
	else
		alert('Login failed');
}
