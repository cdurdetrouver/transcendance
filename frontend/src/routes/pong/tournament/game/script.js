import { customalert } from "../../../../components/alert/script.js";
import { router } from '../../../../app.js';

const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");

const backgroundCanvas = document.getElementById("backgroundCanvas");
const backgroundCtx = backgroundCanvas.getContext("2d");

const lifeCanvas = document.getElementById("lifeCanvas");
const lifeCtx = lifeCanvas.getContext("2d");

const heartImage = new Image();
heartImage.src = '../../../static/assets/pong/heart.png'; 

const paddleWidth = 10;
const paddleHeight = 75;
const ballRadius = 8;


function drawBackground() {
    backgroundCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

    const backgroundImage = new Image();
    backgroundImage.src = '../../../static/assets/background/pongBG2.png';
    backgroundImage.onload = () => {
        backgroundCtx.drawImage(backgroundImage, 0, 0, backgroundCanvas.width, backgroundCanvas.height);
    };
}

function centerPongCanvas() {
    const bgWidth = backgroundCanvas.width;
    const bgHeight = backgroundCanvas.height;
    const pongWidth = canvas.width;
    const pongHeight = canvas.height;

    const centerX = (bgWidth - pongWidth) / 2;
    const centerY = (bgHeight - pongHeight) / 2;
    canvas.style.left = `${centerX}px`;
    canvas.style.top = `${centerY}px`;
}

function drawScores(player1Score, player2Score) {
    lifeCtx.clearRect(0, 0, canvas.width, 40); 
	
    for (let i = 0; i < player1Score; i++) {
        lifeCtx.drawImage(heartImage, 20 + i * 30, 10, 20, 20); 
    }

    for (let i = 0; i < player2Score; i++) {
        lifeCtx.drawImage(heartImage, canvas.width - 200 + i * 30, 10, 20, 20); 
    }
}

function draw_reset() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = 'black';
	ctx.fillRect(5, (canvas.height - paddleHeight) / 2, paddleWidth, paddleHeight);
	ctx.fillRect(canvas.width - paddleWidth - 5, (canvas.height - paddleHeight) / 2, paddleWidth, paddleHeight);

	ctx.beginPath();
	ctx.arc(canvas.width / 2, canvas.height / 2, ballRadius, 0, Math.PI * 2);
	ctx.fillStyle = 'red';
	ctx.fill();
	ctx.closePath();

	drawScores(3, 3);
}

class PongGame {
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;
        this.winner = null;
    }

    async gameStart() {
        this.game_ended = false;

        this.player1Score = 3;
        this.player2Score = 3;

        this.paddle1Y = (canvas.height - paddleHeight) / 2;
        this.paddle2Y = (canvas.height - paddleHeight) / 2;
        this.paddle1speed = 0;
        this.paddle2speed = 0;
        this.paddle1moveup = false;
        this.paddle1movedown = false;
        this.paddle2moveup = false;
        this.paddle2movedown = false;
        this.ballX = canvas.width / 2;
        this.ballY = canvas.height / 2;
        this.ballspeedX = 3;
        this.ballspeedY = 3;

        await new Promise(resolve => {
            document.addEventListener('keydown', (e) => {
                if (e.key === ' ') {
                    resolve();
                }
            });
        });

        this.game_started = true;

        window.addEventListener('keydown', (e) => this.inputDown(e));
        window.addEventListener('keyup', (e) => this.inputUp(e));

        draw_reset();

        return new Promise(resolve => {
            this.gameLoop(resolve);
        });
    }

    inputUp(event) {
        if (event.key === 'w') {
            this.paddle1moveup = false;
        }
        else if (event.key === 's') {
            this.paddle1movedown = false;
        }
        else if (event.key === 'ArrowUp') {
            this.paddle2moveup = false;
        }
        else if (event.key === 'ArrowDown') {
            this.paddle2movedown = false;
        }
    }

    inputDown(event) {
        if (event.key === 'w') {
            this.paddle1moveup = true;
        }
        else if (event.key === 's') {
            this.paddle1movedown = true;
        }
        else if (event.key === 'ArrowUp') {
            this.paddle2moveup = true;
        }
        else if (event.key === 'ArrowDown') {
            this.paddle2movedown = true;
        }
    }

    draw () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'black';
        ctx.fillRect(5, this.paddle1Y, paddleWidth, paddleHeight);
        ctx.fillRect(canvas.width - paddleWidth - 5, this.paddle2Y, paddleWidth, paddleHeight);

        ctx.beginPath();
        ctx.arc(this.ballX, this.ballY, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.closePath();

        drawScores(this.player1Score, this.player2Score);
    }

    update() {
        if (this.player1Score === 0) {
            this.winner = this.player2;
            this.game_ended = true;
        }
        else if (this.player2Score === 0) {
            this.winner = this.player1;
            this.game_ended = true;
        }

        
        if (RectCircleColliding({ x: this.ballX, y: this.ballY, radius: ballRadius }, { x: 5, y: this.paddle1Y, width: paddleWidth, height: paddleHeight })) {
            this.ballspeedX = -this.ballspeedX;
            this.ballspeedY = (this.ballY - (this.paddle1Y + paddleHeight / 2)) / 8;
        }
        else if (this.ballX + this.ballspeedX < 0) {
            this.player1Score--;
            this.ballX = canvas.width / 2;
            this.ballY = canvas.height / 2;
            this.ballspeedX = 3;
            this.ballspeedY = 3;
        }


        if (RectCircleColliding({ x: this.ballX, y: this.ballY, radius: ballRadius }, { x: canvas.width - paddleWidth - 5, y: this.paddle2Y, width: paddleWidth, height: paddleHeight })) {
            this.ballspeedX = -this.ballspeedX;
            this.ballspeedY = (this.ballY - (this.paddle2Y + paddleHeight / 2)) / 8;
        }
        else if (this.ballX + this.ballspeedX > canvas.width) {
            this.player2Score--;
            this.ballX = canvas.width / 2;
            this.ballY = canvas.height / 2;
            this.ballspeedX = 3;
            this.ballspeedY = 3;
        }

        if (this.ballY - ballRadius < 0 || this.ballY + ballRadius > canvas.height) {
            this.ballspeedY = -this.ballspeedY;
        }

        if (this.paddle1moveup && this.paddle1Y > 0) {
            this.paddle1speed = -10;
        }
        else if (this.paddle1movedown && this.paddle1Y < canvas.height - paddleHeight) {
            this.paddle1speed = 10;
        }
        else {
            this.paddle1speed = 0;
        }

        if (this.paddle2moveup && this.paddle2Y > 0) {
            this.paddle2speed = -10;
        }
        else if (this.paddle2movedown && this.paddle2Y < canvas.height - paddleHeight) {
            this.paddle2speed = 10;
        }
        else {
            this.paddle2speed = 0;
        }

        this.paddle1Y += this.paddle1speed;
        if (this.paddle1Y < 0) {
            this.paddle1Y = 0;
        }
        else if (this.paddle1Y > canvas.height - paddleHeight) {
            this.paddle1Y = canvas.height - paddleHeight;
        }

        this.paddle2Y += this.paddle2speed;
        if (this.paddle2Y < 0) {
            this.paddle2Y = 0;
        }
        else if (this.paddle2Y > canvas.height - paddleHeight) {
            this.paddle2Y = canvas.height - paddleHeight;
        }

        this.ballX += this.ballspeedX;
        this.ballY += this.ballspeedY;
    }

    async gameLoop(resolve) {
        if (!this.game_ended) {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.gameLoop(resolve));
        }
        else
        {
            draw_reset();
            resolve();
        }
    }
}

function RectCircleColliding(circle, rect) {
    var distX = Math.abs(circle.x - rect.x - rect.width / 2);
    var distY = Math.abs(circle.y - rect.y - rect.height / 2);

    if (distX > Math.abs(rect.width / 2 + circle.radius)) {
        return false;
    }
    if (distY > Math.abs(rect.height / 2 + circle.radius)) {
        return false;
    }
    
    if (distX <= Math.abs(rect.width / 2)) {
        return true;
    }
    if (distY <= Math.abs(rect.height / 2)) {
        return true;
    }

    var dx = distX - Math.abs(rect.width / 2);
    var dy = distY - Math.abs(rect.height / 2);
    return (dx * dx + dy * dy <= (circle.radius * circle.radius));
}

let players = [];

class Match {
    constructor(player1 = null, player2 = null, winner = null) {
        this.player1 = player1;
        this.player2 = player2;
        this.winner = winner;
        this.left = null;
        this.right = null;
    }
}

class Tournament {
    constructor(players) {
        if (players.length === 0) {
            throw new Error("Tournament requires at least one player.");
        }

        this.players = players.length % 2 === 0 ? players : [...players, null];
        this.root = this.buildTournamentTree(this.players);
    }

    buildTournamentTree(players) {
        if (players.length === 1) {
            return new Match(players[0], null);
        }

        let nextRound = [];
        let matches = [];

        for (let i = 0; i < players.length; i += 2) {
            let player1 = players[i];
            let player2 = i + 1 < players.length ? players[i + 1] : null;
            let match = new Match(player1, player2);
            matches.push(match);

            nextRound.push(match);
        }

		matches.forEach(match => {
			console.log(`Match between ${match.player1} and ${match.player2}`);
		});

        return this.buildMatches(nextRound);
    }

    buildMatches(matches) {
        if (matches.length === 1) {
            return matches[0];
        }

        let nextRound = [];
        for (let i = 0; i < matches.length; i += 2) {
            let left = matches[i];
            let right = i + 1 < matches.length ? matches[i + 1] : null;
            let match = new Match();
            match.left = left;
            match.right = right;
            nextRound.push(match);
        }

        return this.buildMatches(nextRound);
    }

    async playMatch(match) {
        if (!match || (!match.player1 && !match.player2)) {
            return null;
        }
        if (!match.player2) {
            match.winner = match.player1;
        } else {
            customalert("Match", `${match.player1} VS ${match.player2}`);
            console.log(`Match playing ${match.player1} vs ${match.player2}`);
            // Play the game
            let pongGame = new PongGame(match.player1, match.player2);
            await pongGame.gameStart();
            match.winner = pongGame.winner;
            console.log("Game ended");
            // await pongGame.clear();
            customalert("Winner", `${match.winner} wins the match!`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        return match.winner;
    }

    async playTournament(match = this.root) {
        if (!match) return null;

        if (match.left) match.player1 = await this.playTournament(match.left);
        if (match.right) match.player2 = await this.playTournament(match.right);

        return await this.playMatch(match);
    }
}


export async function initComponent() {
    const urlParams = new URLSearchParams(window.location.search);
    players = urlParams.get('players').split(',');
    players.forEach(player => {
        if (player.length ===0) {
            customalert("Error", "Player name cannot be empty.");
            router.navigate('/tournament');
        }
        else if (player.length > 10) {
            customalert("Error", "Player name cannot be longer than 10 characters.");
            router.navigate('/tournament');
        }
    });

	const tournament = new Tournament(players);

    draw_reset();
	centerPongCanvas();
	drawBackground();

    // the game is starting
    const winner = await tournament.playTournament();

    customalert("Winner", `${winner} wins the tournament!`);
    // game is finished
}
