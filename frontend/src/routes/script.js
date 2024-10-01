// import { get_user } from '../components/user/script.js';
// import { customalert, clearalert } from '../components/alert/script.js';

// export async function initComponent() {
// 	let user = await get_user();
// 	if (user)
// 		document.querySelector('#user_username').innerText = user.username;

// 	let buttonSucecs = document.querySelector('#button_success');
// 	buttonSucecs.addEventListener('click', () => {
// 		customalert('Success', 'This is a success message');
// 	});

// 	let buttonError = document.querySelector('#button_error');
// 	buttonError.addEventListener('click', () => {
// 		const delay = clearalert() ? 200 : 0;
// 		setTimeout(() => {
// 			customalert('Error', 'This is an error message', true);
// 		}, delay);
// 	});
// }

import { getCookie } from '../../components/storage/script.js';
import { get_user } from '../../components/user/script.js';


const popup = document.getElementById("popin");
const openPopupBtn = document.getElementById("login");
const closePopupBtn = document.getElementById("closePopupBtn");

openPopupBtn.addEventListener("click", function() {
    popup.style.display = "flex"; // Make the popup visible
});

closePopupBtn.addEventListener("click", function() {
    popup.style.display = "none";
});

window.addEventListener("click", function(event) {
    if (event.target === popup) {
        popup.style.display = "none";
    }
});

const register = document.getElementById("register-content");
const login = document.getElementById("login-content");

const openPopinBtn = document.getElementById("register");
const closePopinBtn = document.getElementById("closePopupBtn");

openPopupBtn.addEventListener("click", function() {
    popup.style.display = "flex"; // Make the popup visible
});

closePopupBtn.addEventListener("click", function() {
	popup.style.display = "none";
});

window.addEventListener("click", function(event) {
	if (event.target === popup) {
		popup.style.display = "none";
    }
});

let userElement = document.querySelector('user-info');

openPopinBtn.addEventListener('click', function (event) {
	login.style.display = "none";
	register.style.display = "flex";
});

const submitLoginButton = document.getElementById("submit-login");
const submitRegisterButton = document.getElementById("submit-register");

submitLoginButton.addEventListener('click', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    console.log('Username:', username);
    console.log('Email:', email);
    console.log('Password:', password);
	// const result = await register(username, email, password);
	// console.log(result);
});

// let submitButton = document.getElementById('newrun');
// submitButton.disabled = true;


//     // Récupérer l'élément où on va afficher les informations utilisateur
//     let userInfoElement = document.querySelector('#user-info');
//     let loginElement = document.querySelector('#login');

//     // Récupérer le cookie utilisateur
//     let userCookie = getCookie('user');

//     if (userCookie) {
//         // Si un cookie existe, cela signifie que l'utilisateur est déjà connecté
//         const user = JSON.parse(userCookie);
        
//         // Afficher son nom dans #user-info
//         userInfoElement.innerText = `${user.username} is connected`;

//         // Cacher ou désactiver le lien de login
//         loginElement.style.display = 'none'; // Cache le bouton LOGIN
//     } else {
//         // Sinon, essayer de récupérer l'utilisateur via l'API
//         await get_user();
//         userCookie = getCookie('user');
//         if (userCookie) {
//             const user = JSON.parse(userCookie);
//             userInfoElement.innerText = `${user.username} is connected`;
//             loginElement.style.display = 'none';
//         } else {
//             // Si l'utilisateur n'est pas connecté, afficher "No user connected"
//             userInfoElement.innerText = 'No user connected';
//         }
//     }
// });

// async function checkUserConnection() {
//     let userCookie = getCookie('user');
//     let isConnected = false;

//     if (userCookie) {
//         // Si l'utilisateur est déjà connecté via cookie
//         const user = JSON.parse(userCookie);
//         userElement.innerText = `${user.username} is connected`;  // Affiche le nom d'utilisateur
//         isConnected = true;
//         submitButton.disabled = false;  // Active le bouton si l'utilisateur est connecté
//     } else {
//         // Si pas de cookie, essayer de récupérer l'utilisateur via l'API (par exemple)
//         await get_user();  // Appel API ou fonction pour récupérer l'utilisateur
//         userCookie = getCookie('user');  // Met à jour le cookie après l'appel API
        
//         if (userCookie) {
//             const user = JSON.parse(userCookie);
//             userElement.innerText = `${user.username} is connected`;  // Affiche le nom d'utilisateur
//             isConnected = true;
//             submitButton.disabled = false;  // Active le bouton si l'utilisateur est connecté
//         } else {
//             // Si toujours pas de cookie après tentative de récupération
//             userElement.innerText = 'No user connected';  // Affiche un message si non connecté
//             isConnected = false;
//             submitButton.disabled = true;  // Désactive le bouton
//         }
//     }
// }

