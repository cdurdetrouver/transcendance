setTimeout(function() {
    let headerElement = document.querySelector('header'); 
    
    if (headerElement) {
        headerElement.classList.remove('preload');
    } else {
        console.error("Header element not found");
    }
}, 100);

export async function initComponent() {

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
