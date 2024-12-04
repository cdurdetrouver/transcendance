import { get_user } from "../../components/user/script.js";
import { router } from '../../app.js';
import config from '../../env/config.js';
import {customalert} from '../../components/alert/script.js';

async function get_friend(user_id) {
	const response = await fetch(config.backendUrl + '/user/friend/' + user_id, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json'
		},
		credentials: 'include'
	});
	if (response.status !== 200) {
		console.error('Error connecting to friend');
		customalert('Error', 'Error friend list', true);
		return null;
	}
	// const friends = await response.json();
	// console.log(friends);
	// return friends;
}



export async function initComponent(params) {	
    let user = await get_user();
    if (!user)
        router.navigate('/');
	console.log()
	get_friend(user.id);
}

export async function cleanupComponent(params) {

}