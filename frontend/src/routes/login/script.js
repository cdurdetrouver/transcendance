import { get_user, login, logout } from '../../components/user/script.js';

const user = await get_user();

const loginform = document.querySelector('.login form');
loginform.addEventListener('submit', login_form);

const logoutform = document.querySelector('.logout form');
logoutform.addEventListener('submit', logout_form);

if (user)
	loginform.style.display = 'none';
else
	logoutform.style.display = 'none';

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

async function logout_form(event)
{
	event.preventDefault();
	await logout();

	window.location.href = '/';
}
