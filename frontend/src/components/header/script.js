import { get_user} from '../../components/user/script.js';

let userElement = document.querySelector('#user_username');
let isConnected = false;
const user = await get_user();

const usernameText = document.querySelector('.bottom .text');

usernameText.textContent = user.username;


const firstLi = document.querySelector('.bottom li:first-child');

if (isConnected == true) {
    firstLi.remove();  // Removes the first li element
}

if (user)
{
	userElement.innerText = `${user.username} is connected`;
	isConnected = true;
}
else
{
	userElement.innerText = 'No user connected';
	isConnected = false;
}



export async function initComponent() {
	userElement = document.querySelector('#user_username');
	isConnected = false;
}


export async function cleanupComponent() {
}