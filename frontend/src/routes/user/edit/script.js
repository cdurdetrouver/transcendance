import { customalert } from '../../components/alert/script.js';
import config from '../../env/config.js';
import { get_user } from '../../components/user/script.js';

function setPersonalUser(user) {
	const userDiv = document.querySelector('.container');
	const username = user.username;
	const email = user.email;
	const userHtml = `
		<div class="user__info">
			<p class="user__info__username">${username}</p>
			<p class="user__info__email">${email}</p>
		</div>
		<div class="user__buttons">
			<button class="user__buttons__edit" onclick="router.navigate('/user/edit')">Edit</button>
			<button class="user__buttons__logout" onclick="logout()">Logout</button>
		</div>
	`;
	userDiv.innerHTML = userHtml;
}

export async function initComponent() {
	let me = await get_user();
	if (!me) {
		customalert('Error', 'You are not logged in', true);
		router.navigate('/login?return=/user');
	}

	setPersonalUser(me);
}

export async function cleanupComponent() {
}