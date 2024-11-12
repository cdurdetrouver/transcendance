import { customalert } from "../../../../components/alert/script.js";
import { router } from '../../../../app.js';

const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");

const paddleWidth = 10;
const paddleHeight = 75;
const ballRadius = 8;

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

    playMatch(match) {
        if (!match || (!match.player1 && !match.player2)) {
            return null;
        }
        if (!match.player2) {
            match.winner = match.player1;
        } else {
			console.log(`Playing match between ${match.player1} and ${match.player2}`);
            match.winner = Math.random() > 0.5 ? match.player1 : match.player2;
        }
        return match.winner;
    }

    playTournament(match = this.root) {
        if (!match) return null;

        if (match.left) match.player1 = this.playTournament(match.left);
        if (match.right) match.player2 = this.playTournament(match.right);

        return this.playMatch(match);
    }

	display(match = this.root, round = 0) {
        if (!match) return "";

        const leftHtml = match.left ? this.display(match.left) : "";
        const rightHtml = match.right ? this.display(match.right) : "";

        const currentMatchHtml = `
            <div class="match">
                <div class="player">${match.player1 || "Null"}</div>
                <div class="player">${match.player2 || "Null"}</div>
                <div class="winner">Winner: ${match.winner || "TBD"}</div>
            </div>
        `;

        return `
            <div class="round round-${round}">
                ${leftHtml}
                ${currentMatchHtml}
                ${rightHtml}
            </div>
        `;
    }
}


export async function initComponent() {
    const urlParams = new URLSearchParams(window.location.search);
    players = urlParams.get('players').split(',');

	const tournament = new Tournament(players);

	// const champion = tournament.playTournament();
	document.getElementById('tournament-container').innerHTML = tournament.display();
	console.log(tournament.root);
}
