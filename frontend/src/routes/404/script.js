import { router } from '../../../app.js';


export async function initComponent() {
	const returnButton = document.getElementById("return-button");
	returnButton.addEventListener('click', (e) => {
		router.navigate("/");
	});

}