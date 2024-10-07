import { router } from '../../../app.js';
import { customalert } from '../../../components/alert/script.js';
import { get_user } from '../../../components/user/script.js';
import { deleteCookie, setCookie } from '../../../components/storage/script.js';
import config from '../../../env/config.js';

let secret = '';

async function enable2FA() {
	let token = document.getElementById('2fa_code').value;
	if (token === '') {
		customalert('Error', 'Token cannot be empty', true);
		return;
	}
	console.log(secret, token);
	const response = await fetch(config.backendUrl + '/user/enable-2fa/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			'token': token,
			'secret': secret
		}),
		credentials: 'include',
	});

	if (response.status === 200) {
		const data = await response.json();
		deleteCookie('user');
		setCookie('user', JSON.stringify(data.user), 5 / 1440);
		customalert('Success', '2FA enabled successfully', false);
		router.navigate('/user/edit');
	}
	else {
		customalert('Error', 'Failed to enable 2FA', true);
	}
}

async function getQrcode() {
	console.log('getQrcode');
	const response = await fetch(config.backendUrl + '/user/generate-2fa-qr/', {
		method: 'GET',
		credentials: 'include',
	});

	const data = await response.json();

	if (response.status === 200) {
		const qr_code = data.qr_code;
		secret = data.secret;
		const button_qr_code = document.getElementById('gen-qrcode');
		button_qr_code.style.display = 'none';
		const qr_code_div = document.getElementsByClassName('qr_code').item(0);
		qr_code_div.style.display = 'block';
		const qr_code_img = document.getElementById('img_qr_code');
		qr_code_img.src = `data:image/png;base64,${qr_code}`
	}
	else {
		customalert('Error', data.error, true);
	}
}

export async function initComponent() {
	let user = await get_user();
	if (!user) {
		customalert('Error', 'You are not logged in', true);
		router.navigate('/login?return=/user/edit');
	}
	const button_qr_code = document.getElementById('gen-qrcode');
	button_qr_code.addEventListener('click', getQrcode);

	const button_verify_2fa = document.getElementById('verify-2fa');
	button_verify_2fa.addEventListener('click', enable2FA);
}

export async function clearComponent() {
	const button_qr_code = document.getElementById('gen-qrcode');
	button_qr_code.removeEventListener('click', getQrcode);

	const button_verify_2fa = document.getElementById('verify-2fa');
	button_verify_2fa.removeEventListener('click', enable2FA);
}
