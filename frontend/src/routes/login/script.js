import { get_user, login, logout, login_tierce } from '../../components/user/script.js';
import { customalert } from '../../components/alert/script.js';
import { router } from '../../app.js';
import config from '../../env/config.js';

export async function initComponent() {
	const user = await get_user();

	const logindiv = document.querySelector('.login');
	const loginform = logindiv.querySelector('form');
	loginform.addEventListener('submit', login_form);

	const logoutdiv = document.querySelector('.logout');
	const logoutform = logoutdiv.querySelector('form');
	logoutform.addEventListener('submit', logout_form);

	const ButtonIntra = document.querySelector('.intra_button');
	ButtonIntra.href = `https://api.intra.42.fr/oauth/authorize?client_id=${config.intra_client_id}&redirect_uri=${encodeURIComponent(config.frontendUrl + '/login')}&response_type=code`;
	const ButtonGithub = document.querySelector('.github_button');
	ButtonGithub.href = `https://github.com/login/oauth/authorize?client_id=${config.github_id}&redirect_uri=${encodeURIComponent(config.frontendUrl + '/login?source=github')}&scope=user`;
	const ButtonGoogle = document.querySelector('.google_button');
	ButtonGoogle.href = `https://accounts.google.com/o/oauth2/auth?client_id=${config.google_id}&redirect_uri=${encodeURIComponent(config.frontendUrl + '/login?source=google')}&response_type=code&scope=openid%20email%20profile`;

	if (user)
		logindiv.style.display = 'none';
	else
		logoutdiv.style.display = 'none';

	const urlParams = new URLSearchParams(window.location.search);
	const code = urlParams.get('code');
	const source = urlParams.get('source');

	if (code) {
		const response = await login_tierce(code, source??'intra');
		if (response.status !== 200) {
			const data = await response.json();
			customalert('Login failed', data.error, true);
		} else {
			customalert('Login successful', 'You are now logged in');
			router.navigate('/');
			return;
		}
	}
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
