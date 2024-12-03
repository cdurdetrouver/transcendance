import { customalert } from "../../../components/alert/script.js";
import { router } from '../../../app.js';


export async function initComponent() {
    const playerInput = document.getElementById('player');
    const addPlayerButton = document.getElementById('addPlayer');
    const playersDiv = document.getElementById('players');
    const startButton = document.getElementById('start');
    const players = [];
  
	addPlayerButton.addEventListener('click', addPlayer);

	playerInput.addEventListener('keydown', (event) => {
	  if (event.key === 'Enter') {
		addPlayer();
	  }
	});

	function addPlayer() {
		const playerName = playerInput.value.trim();
		if (playerName) {
		  players.push(playerName);
		  updatePlayerList();
		  playerInput.value = '';
		}
	  }
  
    startButton.addEventListener('click', () => {
      if (players.length < 2) {
		customalert("Error", "Please add at least two players to start the tournament", true)
      } else {
        startTournament();
      }
    });
  
    function updatePlayerList(index) {
      playersDiv.innerHTML = '';
      players.forEach((player, index) => {
        const playerElement = document.createElement('div');
		playerElement.classList.add('newPlayer');
        playerElement.textContent = `${player}`;

		const removeButton = document.createElement('button');
		removeButton.id = 'removePlayer';
		removeButton.addEventListener('click', () => removePlayer(index));

		playerElement.appendChild(removeButton);
        playersDiv.appendChild(playerElement);
      });
	  playersDiv.scrollTop = playersDiv.scrollHeight;
    }

	function removePlayer(index) {
		players.splice(index, 1);
		updatePlayerList();
	}
  
    function startTournament() {
        customalert('Tournament started', 'Good luck!', false);
        const url = '/tournament/game?players=' + players.join(',');
        router.navigate(url);
    }

////

	const startmulti = document.getElementById('start-multi');

	startmulti.addEventListener('click', () => {
	let players = [];

	for (let i = 1; i <= 4; i++) {
		const player = document.getElementById('player' + i);
		if (player.value && !players.includes(player.value)) {
		players.push(player.value);
		}
	}

	if (players.length !== 4) {
		customalert('Error', 'Select 4 corret players', true);
		return;
	}

	startMulti(players);
	});

	function startMulti(players) {
		customalert('Tournament started', 'Good luck!', false);
		const url = '/multiplayer/game?player1=' + players[0] + '&player2=' + players[1] + '&player3=' + players[2] + '&player4=' + players[3];
		router.navigate(url);
	}

	
	const mainContainer = document.getElementById("container");
	const tournamentContainer = document.getElementById("container-tournament");
	const tournamentClick = document.getElementById("tournament-postit")
	const multiContainer = document.getElementById("container-multi");
	const multiClick = document.getElementById("multi-postit")
	const returnButton = document.getElementById("return-button");


	tournamentClick.addEventListener('click', (event) => {
		mainContainer.style.display = "none";
		tournamentContainer.style.display = "flex"
		returnButton.style.display = "flex"
	});

	multiClick.addEventListener('click', (event) => {
		mainContainer.style.display = "none";
		multiContainer.style.display = "flex"
		returnButton.style.display = "flex"
	});

	returnButton.addEventListener('click', (e) => {
		mainContainer.style.display = "flex";
		tournamentContainer.style.display = "none"
		multiContainer.style.display = "none"
		returnButton.style.display = "none"
	});


}

export function cleanupComponent() {

}
