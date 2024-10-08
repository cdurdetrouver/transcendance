import { customalert } from '../../../components/alert/script.js';
import { get_user, update_user, delete_user } from '../../../components/user/script.js';
import { router } from '../../../app.js';

function setPersonalUser(user) {
	const userDiv = document.querySelector('.container');
	const username = user.username;
	const email = user.email;
	const userHtml = `
		<div class="user__info">
			<p class="user__info__username">${username}</p>
			<p class="user__info__email">${email}</p>
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
	const username = formData.get('username');
	const profilePicture = formData.get('profilePicture');

	try {
		await update_user({ username, profilePicture });
		customalert('Success', 'User updated successfully', false);
	} catch (error) {
		customalert('Error', 'Failed to update user', true);
	}
}

async function handleDeleteAccount() {
	if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
		try {
			await delete_user();
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