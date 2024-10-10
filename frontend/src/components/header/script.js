import { getCookie } from '../../components/storage/script.js';
import { get_user } from '../../components/user/script.js';

let userCookie = getCookie('user');
let userElement = document.querySelector('#user_username');
let isConnected = false;

if (userCookie)
{
	const user = JSON.parse(userCookie);
    userElement.innerText = `${user.username} is connected`;
	isConnected = true;
}
else
{
	await get_user();
	let userCookie = getCookie('user');

	if (userCookie)
	{
		const user = JSON.parse(userCookie);
		userElement.innerText = `${user.username} is connected`;
		isConnected = true;
	}
	else
	{
		userElement.innerText = 'No user connected';
		isConnected = false;
	}

}



export async function initComponent() {
}


export async function cleanupComponent() {
}