import { get_user } from '../components/user/script.js';
import { customalert, clearalert } from '../components/alert/script.js';

function test(event) {
	console.log(event.target.id);
	console.log('test');
}

export async function initComponent() {
	let user = await get_user();
	if (user)
		document.querySelector('#user_username').innerText = user.username;

	let buttonSucecs = document.querySelector('#button_success');
	buttonSucecs.addEventListener('click', () => {
		customalert('Success', 'This is a success message');
	});

	let buttonError = document.querySelector('#button_error');
	buttonError.addEventListener('click', test);
}

