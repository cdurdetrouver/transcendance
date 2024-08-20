import Home from './views/Home.js';
import About from './views/About.js';
import Test from './views/Test.js';
import Pong from './views/Pong.js';

const route = async () => {
	const routes = [
		{path: '/', view: Home},
		{path: '/about', view: About},
		{path: '/test', view: Test},
		{path: '/pong', view: Pong}
	];

	console.log(location.pathname);

	const potentialMatches = routes.map(route => {
		return {
			route: route,
			isMatch: location.pathname === route.path
		};
	});

	let match = potentialMatches.find(potentialMatch => potentialMatch.isMatch);

	if (!match) {
		match = {
			route: routes[0],
			isMatch: true
		};
	}

	const view = new match.route.view();

	document.querySelector('#app').innerHTML = await view.getHtml();

	const scriptContent = view.getScript();
    const scriptElement = document.createElement('script');
    scriptElement.textContent = scriptContent;
    document.body.appendChild(scriptElement);
}

route();
