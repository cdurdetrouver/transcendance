import { get_user} from '../../components/user/script.js';
import config from '../../env/config.js';


setTimeout(function() {
    let headerElement = document.querySelector('header'); 
    
    if (headerElement) {
        headerElement.classList.remove('preload');
    } else {
        console.error("Header element not found");
    }
}, 100);


export async function initComponent() {
	const user = await get_user();

	const usernameText = document.querySelector('.bottom .text-header');

	if (user)
	{
		usernameText.textContent = user.username;
		let imgElement = document.querySelector('.icon.avatar img');
		const profile_picture = user.picture_remote ? user.picture_remote : config.backendUrl + user.profile_picture;
		imgElement.src = profile_picture;
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