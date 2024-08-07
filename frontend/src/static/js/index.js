import Home from './views/Home.js';
import About from './views/About.js';

const route = async () => {
	const routes = [
		{path: '/', view: Home},
		{path: '/about', view: About},
	];

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
}

route();
