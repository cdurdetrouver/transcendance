import { customalert } from '../../../components/alert/script.js';
import { get_user, update_user, delete_user } from '../../../components/user/script.js';
import { router } from '../../../app.js';
import { deleteCookie, setCookie } from '../../../components/storage/script.js';

function setPersonalUser(user) {
	const userDiv = document.querySelector('.container');
	const username = user.username;
	const email = user.email;
	const profile_picture = user.picture_remote ? user.picture_remote : config.backendUrl + user.profile_picture;
	const userHtml = `
		<div class="user__info">
			<p class="user__info__username">${username}</p>
			<p class="user__info__email">${email}</p>
			<img src="${profile_picture}" alt="Profile Picture">
		</div>
		<form id="userForm" class="user__form">
			<label for="username">Username:</label>
			<input type="text" id="username" name="username" value="${username}" required>

			<label for="profilePicture">Profile Picture:</label>
			<input type="file" id="profilePicture" name="profilePicture" accept="image/*">

			<button type="submit">Update</button>
			<button type="button" id="deleteAccount">Delete Account</button>
		</form>
	`;
	userDiv.innerHTML = userHtml;

	document.getElementById('userForm').addEventListener('submit', handleFormSubmit);
	document.getElementById('deleteAccount').addEventListener('click', handleDeleteAccount);
}

async function handleFormSubmit(event) {
	event.preventDefault();
	const form = event.target;
	const formData = new FormData(form);
	console.log(formData);
	let response = await update_user(formData);
	if (response.status === 200) {
		customalert('Success', 'User updated successfully', false);
		let data = await response.json();
		setPersonalUser(data.user);
		deleteCookie('user');
		setCookie('user', JSON.stringify(data.user), 5 / 1440);
	}
	else {
		let data = await response.json();
		customalert('Error', data.error, true);
	}
}

export async function handleDeleteAccount() {
	if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
		try {
			await delete_user();
			deleteCookie('user');
			customalert('Success', 'Account deleted successfully', false);
			router.navigate('/login');
		} catch (error) {
			customalert('Error', 'Failed to delete account', true);
		}
	}
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
