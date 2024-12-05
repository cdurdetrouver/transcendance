import { get_user, login, logout, login_tierce } from '../../components/user/script.js';
import { customalert } from '../../components/alert/script.js';
import { router } from '../../app.js';
import config from '../../env/config.js';
import { setCookie } from '../../components/storage/script.js';

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
		const response = await login_tierce(code, source ?? 'intra');
		const data = await response.json();
		if (response.status !== 200)
			customalert('Login failed', data.error, true);
		else {
			if (data.two_factor_enabled) {
				ask2FA(data.user_id);
				return;
			}

			setCookie('user', JSON.stringify(data.user), 5 / 1440);
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

	const div_2fa = document.querySelector('.div_2fa');
	const form = div_2fa.querySelector('form');
	let user_id = null;
	
	form.addEventListener('submit', (event) => form_2fa(event, user_id));
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
		const data = await response.json();
		if (data.two_factor_enabled) {
			ask2FA(data.user_id);
			return;
		}
		setCookie('user', JSON.stringify(data.user), 5 / 1440);
		router.navigate(href);
		customalert('Login successful', 'You are now logged in');
	}
	else {
		const data = await response.json();
		customalert('Login failed', data.error, true);
	}
}

async function form_2fa(event, user_id) {
	event.preventDefault();
	const token = document.querySelector('input[name="token_2fa"]').value;

	const response = await fetch(config.backendUrl + '/user/verify-2fa/', {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			'token': token,
			'user_id': user_id
		}),
		credentials: "include",
	});

	if (response.status === 200) {
		const data = await response.json();
		setCookie('user', JSON.stringify(data.user), 5 / 1440);
		customalert('Login successful', 'You are now logged in');
		router.navigate('/');
	}
	else {
		const data = await response.json();
		customalert('Login failed', data.error, true);
		const loginform = document.querySelector('.login');
		loginform.style.display = 'block';
		const div_2fa = document.querySelector('.div_2fa');
		div_2fa.style.display = 'none';
	}
}

async function ask2FA(user_id) {
	const loginform = document.querySelector('.login');
	loginform.style.display = 'none';
	const div_2fa = document.querySelector('.div_2fa');
	div_2fa.style.display = 'block';
	customalert('2FA required', 'Please enter your 2FA code');
	const form = div_2fa.querySelector('form');
	form.addEventListener('submit', (event) => form_2fa(event, user_id));
}

async function logout_form(event) {
	event.preventDefault();
	await logout();
	customalert('Logout successful', 'You are now logged out');
	router.navigate('/');
}
