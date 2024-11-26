import { customalert } from "../../../components/alert/script.js";
import { router } from '../../../app.js';

export async function initComponent() {
    console.log('Hello from Pong Tournament!');
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
      players.forEach((player) => {
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
}
