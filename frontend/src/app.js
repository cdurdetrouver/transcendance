import { deleteCookie, getCookie } from "./components/storage/script.js";
import { get_user, refresh_token, refresh_user } from "./components/user/script.js";
import config from "./env/config.js";

class Router {
	constructor() {
		this.routes = [];
		this.components = {};
		this.componentsscripts = [];
		this.componentsstyles = [];
		this.activeScripts = [];
		this.loaded = document.getElementById("loaded");
		this.socket = null;
	}

	async initRouter() {
		// Fetch routes from JSON configuration file
		try {
			const response = await fetch('/routes.json');
			this.routes = await response.json();
			await this._loadInitialRoute();

			// Listen for link clicks
			document.body.addEventListener('click', (event) => {
				const link = event.target.closest('[data-link]');
				if (link) {
					event.preventDefault();
					const pathName = link.getAttribute('href');
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
		this.connect();
		const pathName = window.location.pathname;
		await this._loadRoute(pathName);
	}

	async connect() {
		if (this.socket == null)
		{
			this.socket = new WebSocket(config.websocketurl + "/ws/user/status/");
			this.socket.onmessage = async (e) => {
				const data = JSON.parse(e.data);
				if (data.type == "success") await refresh_user();
			}
		}
	}

	async disconnect() {
		if (this.socket) {
			this.socket.close();
			this.socket = null;
		}
	}

	async navigate(pathName) {
		if (pathName == null) return;
		history.pushState({}, '', pathName);
		await this._loadRoute(pathName);
	}

	async _loadRoute(pathName) {
		document.querySelector('#app').style.display = "none";
		this.loaded.style.display = "block";
		if (getCookie("user") == null) await refresh_token();
		let route = this.routes.find(r => r.path === pathName.split('?')[0] || r.path + '/' === pathName.split('?')[0]);
		if (!route) {
			route = this.routes.find(r => r.path === '/404');
			if (!route) {
				console.error('404 page not found');
				return;
			}
		}

		// Remove previously loaded scripts and styles
		await this._clearDynamicAssets();

		const files = route.files;

		try {
			// Load HTML content of the route
			let html = await fetch(`/routes${files}/page.html`).then(res => res.text());

			// Load and replace components within the HTML content
			html = await this._loadComponentsHtml(html);

			document.querySelector('#app').innerHTML = html;

			// Load and execute JS for the route
			for (const script of this.componentsscripts) {
				await this._loadScript(script);
			}
			await this._loadScript(`/routes${files}/script.js`);

			// Load CSS for the route
			for (const style of this.componentsstyles) {
				this._loadStyle(style);
			}
			this._loadStyle(`/routes${files}/style.css`);

			this.componentsscripts = [];
			this.componentsstyles = [];

		} catch (error) {
			console.error(`Error loading route "${pathName}":`, error);
		}
		setTimeout(() =>{
			this.loaded.style.display = "none";
			document.querySelector('#app').style.display = "block";
		}, 50);
	}

	async _loadComponentsHtml(html) {
		const componentMatches = html.match(/{{\s*([\w-]+)\s*}}/g);
		if (!componentMatches) return html;

		for (const match of componentMatches) {
			const componentName = match.replace(/[{}]/g, '').trim();
			const componentHtml = await this._fetchComponentHtml(componentName);
			html = html.replace(match, componentHtml);

			this.componentsscripts.push(`/components/${componentName.toLowerCase()}/script.js`);

			this.componentsstyles.push(`/components/${componentName.toLowerCase()}/style.css`);
		}

		return html;
	}

	async _fetchComponentHtml(componentName) {
		try {
			const html = await fetch(`/components/${componentName.toLowerCase()}/page.html`)
				.then(res => {
					if (!res.ok) {
						throw new Error(`Error loading component "${componentName}": ${res.status}`);
					}
					return res.text()
				});
			return html;
		} catch (error) {
			console.error(`Error loading component "${componentName}":`, error);
			return '';
		}
	}

	async _loadScript(scriptUrl) {
		try {
			const module = await import(`${scriptUrl}`);

			if (module && typeof module.initComponent === 'function') {
				module.initComponent();
			}

			this.activeScripts.push(module);
		} catch (error) {
			console.error(`Error loading script "${scriptUrl}":`, error);
		}
	}

	_loadStyle(styleUrl) {
		const styleElement = document.createElement('link');
		styleElement.rel = 'stylesheet';
		styleElement.href = styleUrl;
		styleElement.setAttribute('data-dynamic', 'true');
		document.head.appendChild(styleElement);
	}

	async _clearDynamicAssets() {
		for (const script of this.activeScripts) {
			if (script && typeof script.cleanupComponent === 'function') {
				try {
					await script.cleanupComponent();;
				} catch (error) {
					console.error(`Error Cleanup script :`, error);
				}
			}
		}

		this.activeScripts = [];

		// Remove previously loaded scripts
		Array.from(document.querySelectorAll('script[data-dynamic]')).forEach(script => script.remove());

		// Remove previously loaded styles
		Array.from(document.querySelectorAll('link[data-dynamic]')).forEach(link => link.remove());
	}
}

// Initialize Router
export const router = new Router();
router.initRouter();
