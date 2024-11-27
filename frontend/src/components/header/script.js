import { get_user} from '../../components/user/script.js';
import { login, register } from '../user/script.js';
import {customalert} from '../alert/script.js';
import config from '../../env/config.js';



setTimeout(function() {
    let headerElement = document.querySelector('header'); 
    
    if (headerElement) {
        headerElement.classList.remove('preload');
    } else {
        console.error("Header element not found");
    }
}, 100);


const avatarIcon = document.getElementById('avatar-icon');


export async function initComponent() {
	const user = await get_user();

	const sidebar = document.querySelector('.sidebar');
	const iconImage = document.getElementById('iconImage');

	sidebar.addEventListener('mouseenter', () => {
		iconImage.src = '../../static/assets/header/head_cry_4.gif' ;
	});

	sidebar.addEventListener('mouseleave', () => {
		iconImage.src = '../../static/assets/jpg/head.png';
	});

}

export async function cleanupComponent() {

}
