import { logout } from "../../components/user/script.js";

const form = document.querySelector('.logout form');
form.addEventListener('submit', logout_form);

async function logout_form(event)
{
	event.preventDefault();
	await logout();

	window.location.href = '/';
}
