import { Component } from "../Component.js";

export default class Home extends Component {
	constructor() {
		super();
		console.log("Home class");
	}

	async getHtml() {
		return `
			<h1>Here We Go Transcendance ç acommence</h1>
			<p>Et ouais c'est une SPA in pure vanilla js.</p>
		`;
	}
}
