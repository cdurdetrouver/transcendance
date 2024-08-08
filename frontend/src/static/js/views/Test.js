import { Component } from "../Component.js";

export default class Test extends Component {
	constructor() {
		super();
		console.log("Test class");
	}

	async getHtml() {
		return `
			<h1>TEST</h1>
			<p>test page easy.</p>
		`;
	}
}
