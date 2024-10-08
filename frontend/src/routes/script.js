import { get_user, searchUsers } from '../components/user/script.js';
import { customalert, clearalert } from '../components/alert/script.js';
import { router } from '../app.js';

export async function initComponent() {
	let user = await get_user();
	if (user)
		document.querySelector('#user_username').innerText = user.username;

	let buttonSucecs = document.querySelector('#button_success');
	buttonSucecs.addEventListener('click', () => {
		customalert('Success', 'This is a success message');
	});

	let buttonError = document.querySelector('#button_error');
	buttonError.addEventListener('click', () => {
		const delay = clearalert() ? 200 : 0;
		setTimeout(() => {
			customalert('Error', 'This is an error message', true);
		}, delay);
	});

	document.getElementById('user-search').addEventListener('input', async function() {
		const query = this.value;
		if (query.length > 0) {
			const response = await searchUsers(query, 5);
			if (response.status === 200) {
				const data = await response.json();
				updateUserList(data.users);
			} else {
				updateUserList([]);
			}
		} else {
			updateUserList([]);
		}
	});
}

function updateUserList(users) {
	const userList = document.getElementById('user-list');
	userList.innerHTML = '';
	users.forEach(user => {
		const userItem = document.createElement('li');
		userItem.textContent = user.username;
		userItem.onclick = () => {
			router.navigate(`/user?id=${user.id}`);
		};
		userList.appendChild(userItem);
	});
}
