import { Component } from "../Component.js";

export default class Home extends Component {
	constructor() {
		super();
		console.log("Home class");
	}

	async getHtml() {
		const text = "Welcome to Transcendance Pong Game";
	
		return `
			<h1>${text}</h1>
			<p>This site is a Pong game developed as part of the Transcendance project at the 42 school.</p>
			<p>Enjoy playing and improving your skills!</p>
			<style>
				body {
					font-family: Arial, sans-serif;
					margin: 0;
					padding: 0;
					display: flex;
					justify-content: center;
					align-items: center;
					height: 100vh;
					background-color: #f0f0f0;
				}
				.container {
					text-align: center;
					background: #fff;
					padding: 20px;
					border-radius: 8px;
					box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
				}
				h1 {
					color: #333;
				}
				p {
					color: #666;
				}
			</style>
		`;
	}
}
