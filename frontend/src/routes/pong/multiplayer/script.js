import { customalert } from "../../../components/alert/script.js";
import { router } from '../../../app.js';

export async function initComponent() {
    const startButton = document.getElementById('start');

    startButton.addEventListener('click', () => {
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

      startTournament(players);
    });
  
    function startTournament(players) {
        customalert('Tournament started', 'Good luck!', false);
        const url = '/multiplayer/game?player1=' + players[0] + '&player2=' + players[1] + '&player3=' + players[2] + '&player4=' + players[3];
        router.navigate(url);
    }
}
