import { getCookie } from '../components/storage/script.js';
import { get_user, refresh_token } from '../components/user/script.js';

let userCookie = getCookie('user');
if (userCookie)
{
	const user = JSON.parse(userCookie);
	document.querySelector('#user_username').innerText = user.username;
}
else
{
	await get_user();
	let userCookie = getCookie('user');
	const user = JSON.parse(userCookie);

	if (user)
		document.querySelector('#user_username').innerText = user.username;
	else
		window.location.href = '/login';
}
