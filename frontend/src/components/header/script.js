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


function denyLink() {
	const chatLink = document.getElementById('chat-link');
	const accountLink = document.getElementById('account-link');
	const friendsLink = document.getElementById('friends-link');

	chatLink.style.color = 'grey';
	accountLink.style.color = 'grey';
	friendsLink.style.color = 'grey';

	chatLink.removeAttribute('href');
	accountLink.removeAttribute('href');
	friendsLink.removeAttribute('href');

	chatLink.addEventListener('click', function(event) {
		event.preventDefault(); 
		customalert("Error", "Please login to access this !", true);
	  });
	  accountLink.addEventListener('click', function(event) {
	event.preventDefault(); 
	customalert("Error", "Please login to access this !", true);
	});
	friendsLink.addEventListener('click', function(event) {
	event.preventDefault(); 
	customalert("Error", "Please login to access this !", true);
	});
}

export async function initComponent() {
	let user = await get_user();
    if (!user) {
		denyLink();
	}

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
