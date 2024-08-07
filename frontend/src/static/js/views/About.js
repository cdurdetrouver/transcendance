import { Component } from '../Component.js';

export default class About extends Component {
	constructor() {
		super();
		console.log('About class');
	}

	async getHtml() {
		return `
			<h1>About</h1>
			<p>This is the about page.</p>
		`;
	}
}
