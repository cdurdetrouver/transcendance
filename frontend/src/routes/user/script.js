import { customalert } from '../../components/alert/script.js';
import config from '../../env/config.js';
import { get_user } from '../../components/user/script.js';

function setPersonalUser(user) {
	const userDiv = document.querySelector('.user');
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

function setUser(user) {
	const userDiv = document.querySelector('.user');
	const username = user.username;
	const email = user.email;
	const userHtml = `
		<div class="user__info">
			<p class="user__info__username">${username}</p>
			<p class="user__info__email">${email}</p>
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
	const urlparams = new URLSearchParams(window.location.search);
	const id = urlparams.get('id');

	if (!id || id === me.id) {
		setPersonalUser(me);
		return;
	}

	const response = await fetch(config.backendUrl + '/user/' + id, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json'
		},
		credentials: 'include'
	});
	if (response.status !== 200) {
		console.error('Error connecting to user');
		customalert('Error', 'Error get user', true);
		router.navigate('/');
	}
	const user = await response.json();
	setUser(user.user);
}

export async function cleanupComponent() {
}