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

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('openPageButton').addEventListener('click', function () {
        document.getElementById('start').style.transform = 'translateY(-100%)';
        document.getElementById('page').style.transform = 'translateY(0)';
    });
});
