import { Component } from "../Component.js";

export default class Pong extends Component {
	constructor() {
		super();
		console.log("Pong class");
	}

	async getHtml() {
		return `
			<h1>Pong</h1>
			<p>This is the pong page.</p>
		`;
	}
}
