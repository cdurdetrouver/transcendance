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
	}
	else
	{
		const firstLi = document.querySelector('.bottom li:first-child');
		firstLi.remove();  // Removes the first li element
		const secondLi = document.querySelector('.bottom li:first-child');

		const imgElement = secondLi.querySelector('.icon img');
		imgElement.src = '../../static/assets/login.png'; 
		imgElement.alt = 'login-icon';
		const textHeader = secondLi.querySelector('.text-header');
		textHeader.innerText = 'Login'; 
	}


	let imgElement = document.querySelector('.icon.avatar img');
	const profile_picture = user.picture_remote ? user.picture_remote : config.backendUrl + user.profile_picture;
	imgElement.src = profile_picture;

	const sidebar = document.querySelector('.sidebar');
	const iconImage = document.getElementById('iconImage');

	sidebar.addEventListener('mouseenter', () => {
		iconImage.src = '../../static/assets/jpg/head_cry_4.gif' ; // Change to your new icon source
	});

	sidebar.addEventListener('mouseleave', () => {
		iconImage.src = '../../static/assets/jpg/head.png'; // Change back to the original icon
	});

}


export async function cleanupComponent() {

}