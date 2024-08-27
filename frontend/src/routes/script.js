import { login } from '../components/login/script.js';

console.log('Home page script loaded');

document.getElementById('test').addEventListener('click', () => {
	login('cdurdetrouver', 'motdepasse');
});
