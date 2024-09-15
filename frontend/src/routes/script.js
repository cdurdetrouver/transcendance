import { get_user } from '../components/user/script.js';

let user = await get_user();
if (user)
	document.querySelector('#user_username').innerText = user.username;
