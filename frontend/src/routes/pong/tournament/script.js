import { customalert } from "../../../components/alert/script.js";
import { router } from '../../../app.js';

export async function initComponent() {
    console.log('Hello from Pong Tournament!');
    const playerInput = document.getElementById('player');
    const addPlayerButton = document.getElementById('addPlayer');
    const playersDiv = document.getElementById('players');
    const startButton = document.getElementById('start');
    const players = [];
  
    addPlayerButton.addEventListener('click', () => {
      const playerName = playerInput.value.trim();
      if (playerName) {
        players.push(playerName);
        updatePlayerList();
        playerInput.value = '';
      }
    });
  
    startButton.addEventListener('click', () => {
      if (players.length < 2) {
        alert('Please add at least two players to start the tournament.');
      } else {
        startTournament();
      }
    });
  
    function updatePlayerList() {
      playersDiv.innerHTML = '';
      players.forEach((player, index) => {
        const playerElement = document.createElement('div');
        playerElement.textContent = `${index + 1}. ${player}`;
        playersDiv.appendChild(playerElement);
      });
    }
  
    function startTournament() {
        customalert('Tournament started', 'Good luck!', false);
        const url = '/tournament/game?players=' + players.join(',');
        router.navigate(url);
    }
}
