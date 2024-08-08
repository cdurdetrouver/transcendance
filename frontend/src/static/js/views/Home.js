import { Component } from "../Component.js";

export default class Home extends Component {
	constructor() {
		super();
		console.log("Home class");
	}

	async getHtml() {
		const text = "Welcome to the Home Page!";
	
		return `
			<h1>Here We Go Transcendance ça commence</h1>
			<p>${text}</p>
		`;
	}
}
