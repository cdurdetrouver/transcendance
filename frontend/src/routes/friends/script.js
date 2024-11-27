import { get_user, searchUsers } from "../../components/user/script.js";
import { router } from '../../app.js';
import {customalert} from '../../components/alert/script.js';



export async function initComponent(params) {
    user = await get_user();
    if (!user)
        router.navigate('/login');
	console.log(user);
	console.log(user.friends);
}

export async function cleanupComponent(params) {

}
