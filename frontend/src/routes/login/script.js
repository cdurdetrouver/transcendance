import { get_user, login, logout } from '../../components/user/script.js';
import { customalert } from '../../components/alert/script.js';
import { router } from '../../app.js';

export async function initComponent() {
	const user = await get_user();

	const logindiv = document.querySelector('.login');
	const loginform = logindiv.querySelector('form');
	loginform.addEventListener('submit', login_form);

	const logoutdiv = document.querySelector('.logout');
	const logoutform = logoutdiv.querySelector('form');
	logoutform.addEventListener('submit', logout_form);

	if (user)
		logindiv.style.display = 'none';
	else
		logoutdiv.style.display = 'none';
}

export async function cleanupComponent() {
	const logindiv = document.querySelector('.login');
	const loginform = logindiv.querySelector('form');
	loginform.removeEventListener('submit', login_form);

	const logoutdiv = document.querySelector('.logout');
	const logoutform = logoutdiv.querySelector('form');
	logoutform.removeEventListener('submit', logout_form);
}

async function login_form(event) {
	event.preventDefault();
	const urlParams = new URLSearchParams(window.location.search);
	const return_path = urlParams.get('return');
	const href = return_path ?? '/';
	const email = document.querySelector('input[name="email"]').value;
	const password = document.querySelector('input[name="pswd"]').value;

	const response = await login(email, password);

	if (response.status === 200) {
		router.navigate(href);
		customalert('Login successful', 'You are now logged in');
	}
	else {
		const data = await response.json();
		customalert('Login failed', data.error, true);
	}
}

async function logout_form(event) {
	event.preventDefault();
	await logout();
	customalert('Logout successful', 'You are now logged out');
	router.navigate('/login');
}
