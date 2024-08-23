class Router {
	constructor() {
		this.routes = [];
		this.components = {};
		this.componentsscripts = [];
		this.componentsstyles = [];
		this.initRouter();
	}

	async initRouter() {
		// Fetch routes from JSON configuration file
		try {
			const response = await fetch('routes.json');
			this.routes = await response.json();
			await this._loadInitialRoute();

			// Listen for link clicks
			document.body.addEventListener('click', (event) => {
				if (event.target.matches('[data-link]')) {
					event.preventDefault();
					const pathName = event.target.getAttribute('href');
					this.navigate(pathName);
				}
			});

			// Listen for back/forward navigation
			window.addEventListener('popstate', () => {
				this._loadRoute(window.location.pathname);
			});
		} catch (error) {
			console.error('Error loading routes:', error);
		}
	}

	async _loadInitialRoute() {
		const pathName = window.location.pathname;
		await this._loadRoute(pathName);
	}

	async navigate(pathName) {
		// Update the URL without refreshing the page
		history.pushState({}, '', pathName);
		await this._loadRoute(pathName);
	}

	async _loadRoute(pathName) {
		const route = this.routes.find(r => r.path === pathName);
		if (!route) {
			console.error(`Route for path "${pathName}" not found`);
			return;
		}

		const files = route.files;

		try {
			// Load HTML content of the route
			let html = await fetch(`routes${files}/page.html`).then(res => res.text());

			// Load and replace components within the HTML content
			html = await this._loadComponentsHtml(html);

			// Remove previously loaded scripts and styles
			this._clearDynamicAssets();

			document.querySelector('#app').innerHTML = html;

			// Load and execute JS for the route
			for (const script of this.componentsscripts) {
				this._loadScript(script);
			}
			this._loadScript(`routes${files}/script.js`);

			// Load CSS for the route
			for (const style of this.componentsstyles) {
				this._loadStyle(style);
			}
			this._loadStyle(`routes${files}/style.css`);

		} catch (error) {
			console.error(`Error loading route "${pathName}":`, error);
		}
	}

	async _loadComponentsHtml(html) {
		const componentMatches = html.match(/{{\s*([\w-]+)\s*}}/g);
		if (!componentMatches) return html;

		for (const match of componentMatches) {
			const componentName = match.replace(/[{}]/g, '').trim();
			const componentHtml = await this._fetchComponentHtml(componentName);
			html = html.replace(match, componentHtml);

			this.componentsscripts.push(`components/${componentName.toLowerCase()}/script.js`);

			this.componentsstyles.push(`components/${componentName.toLowerCase()}/style.css`);
		}

		return html;
	}

	async _fetchComponentHtml(componentName) {
		try {
			const html = await fetch(`components/${componentName.toLowerCase()}/page.html`).then(res => res.text());
			return html;
		} catch (error) {
			console.error(`Error loading component "${componentName}":`, error);
			return '';
		}
	}

	_loadScript(scriptUrl) {
		const scriptElement = document.createElement('script');
		scriptElement.src = scriptUrl;
		scriptElement.type = 'text/javascript';
		scriptElement.defer = true;
		scriptElement.setAttribute('data-dynamic', 'true');
		document.body.appendChild(scriptElement);
	}

	_loadStyle(styleUrl) {
		const styleElement = document.createElement('link');
		styleElement.rel = 'stylesheet';
		styleElement.href = styleUrl;
		styleElement.setAttribute('data-dynamic', 'true');
		document.head.appendChild(styleElement);
	}

	_clearDynamicAssets() {
		// Remove previously loaded scripts
		Array.from(document.querySelectorAll('script[data-dynamic]')).forEach(script => script.remove());

		// Remove previously loaded styles
		Array.from(document.querySelectorAll('link[data-dynamic]')).forEach(link => link.remove());
	}
}

// Initialize Router
const router = new Router();
