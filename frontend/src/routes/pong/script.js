import config from '../../env/config.js';
import { get_user } from '../.././components/user/script.js';
import { customalert } from '../../components/alert/script.js';
import { router } from '../../app.js';

const svgcheck = `
<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 48 48">
    <defs>
        <mask id="ipSCheckOne0">
            <g fill="none" stroke-linejoin="round" stroke-width="4">
                <path fill="#fff" stroke="#fff"
                    d="M24 44a19.94 19.94 0 0 0 14.142-5.858A19.94 19.94 0 0 0 44 24a19.94 19.94 0 0 0-5.858-14.142A19.94 19.94 0 0 0 24 4A19.94 19.94 0 0 0 9.858 9.858A19.94 19.94 0 0 0 4 24a19.94 19.94 0 0 0 5.858 14.142A19.94 19.94 0 0 0 24 44Z" />
                <path stroke="#000" stroke-linecap="round" d="m16 24l6 6l12-12" />
            </g>
        </mask>
    </defs>
    <path fill="#12d316" d="M0 0h48v48H0z" mask="url(#ipSCheckOne0)" />
</svg>
`;

const svgcross = `
<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 15 15">
  <path fill="#ce0d0d" d="M3.64 2.27L7.5 6.13l3.84-3.84A.92.92 0 0 1 12 2a1 1 0 0 1 1 1a.9.9 0 0 1-.27.66L8.84 7.5l3.89 3.89A.9.9 0 0 1 13 12a1 1 0 0 1-1 1a.92.92 0 0 1-.69-.27L7.5 8.87l-3.85 3.85A.92.92 0 0 1 3 13a1 1 0 0 1-1-1a.9.9 0 0 1 .27-.66L6.16 7.5L2.27 3.61A.9.9 0 0 1 2 3a1 1 0 0 1 1-1c.24.003.47.1.64.27" />
</svg>
`;

let searchButtonTimeoutId = null;
let SearchButton = null;
let SearchStatus = false;
let socket = null;

class MatchmakingSocket {
  constructor() {
    this.socket = null;
  }

  onopen() {
    console.log("Connected to the Matchmaking websocket");
    this.socket.send(JSON.stringify({ message: "Hello, server!" }));
  }

  onmessage(event) {
    let data = JSON.parse(event.data);
    console.log(data);
    if (data.type == "error") {
      get_user().then((response) => {
        if (response == null) {
          customalert("Error", "You are not logged in", true);
          router.navigate('/login');
        }
        this.open();
      });
    }
    if (data.type === 'match_found') {
      toggleSvgStatus(true, true);
      let opponent = data.opponent;
      setPlayer(opponent, true);
      let WaitingTextDiv = document.querySelector('.waiting__message');
      let WaitingText = WaitingTextDiv.querySelector('p');
      WaitingText.innerHTML = "Match found!";
      WaitingTextDiv.classList.remove('show');
      clearTimeout(searchButtonTimeoutId);
      SearchButton.style.opacity = "0.2";
      SearchButton.style.cursor = "not-allowed";
      setTimeout(() => {
        router.navigate('/pong/game?game_room=' + data.game_room + '&game_id=' + data.game_id);
      }, 2000);
    }
  }

  onclose() {
    console.log("Disconnected from the Matchmaking websocket");
  }

  open() {
    if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
      this.socket = new WebSocket(config.websocketurl + "/ws/pong/matchmaking/");
      this.socket.onopen = this.onopen.bind(this);
      this.socket.onmessage = this.onmessage.bind(this);
      this.socket.onclose = this.onclose.bind(this);
    }
  }

  close() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

function setSVGContent(element, svgContent) {
  element.innerHTML = svgContent;
}

function toggleSvgStatus(opponent = false, status = false) {
  if (opponent == true) {
    let div = document.getElementById('opponent');
    let userNameDiv = div.querySelector('.user__status');
    setSVGContent(userNameDiv, status ? svgcheck : svgcross);
  }
  else {
    let div = document.getElementById('player');
    let userNameDiv = div.querySelector('.user__status');
    setSVGContent(userNameDiv, status ? svgcheck : svgcross);
  }
}

function setPlayer(user, opponent = false) {
  if (opponent == true) {
    let div = document.getElementById('opponent');
    let userNameDiv = div.querySelector('.user__name');
    let pElement = userNameDiv.querySelector('p');
    let imgElement = div.querySelector('img');
    pElement.innerHTML = user.username;
    const profile_picture = user.picture_remote ? user.picture_remote : config.backendUrl + user.profile_picture;
    imgElement.src = profile_picture;
  }
  else {
    let div = document.getElementById('player');
    let userNameDiv = div.querySelector('.user__name');
    let pElement = userNameDiv.querySelector('p');
    let imgElement = div.querySelector('img');
    pElement.innerHTML = user.username;
    const profile_picture = user.picture_remote ? user.picture_remote : config.backendUrl + user.profile_picture;
    imgElement.src = profile_picture;
  }
}

async function handleClick() {

  let WaitingTextDiv = document.querySelector('.waiting__message');
  let WaitingText = WaitingTextDiv.querySelector('p');
  if (SearchStatus == false) {
    SearchButton.removeEventListener('click', handleClick);
    searchButtonTimeoutId = setTimeout(() => {
      SearchButton.style.opacity = "1";
      SearchButton.style.cursor = "pointer";
      SearchButton.addEventListener('click', handleClick);
    }, 15000);

    SearchStatus = true;
    SearchButton.innerHTML = "Cancel";
    SearchButton.style.opacity = "0.2";
    SearchButton.style.cursor = "not-allowed";
    SearchButton.style.backgroundColor = "red";
    WaitingText.innerHTML = "";
    WaitingTextDiv.classList.add('show');
    toggleSvgStatus(false, true);

    socket.open();
  }
  else {
    SearchStatus = false;
    SearchButton.innerHTML = "Search";
    SearchButton.style.backgroundColor = "green";
    WaitingText.innerHTML = "Ready to play ?";
    WaitingTextDiv.classList.remove('show');
    toggleSvgStatus(false, false);

    socket.close();
  }
}

export async function initComponent() {
  const user = await get_user();
  if (!user) {
    customalert("Error", "You are not logged in", true);
    router.navigate('/login?return=/pong');
  }

  setPlayer(user);
  toggleSvgStatus(false, false);
  toggleSvgStatus(true, false);

  SearchButton = document.getElementById('search');
  SearchStatus = false;

  socket = new MatchmakingSocket();

  SearchButton.addEventListener('click', handleClick);
}

export async function cleanupComponent() {
  SearchButton.removeEventListener('click', handleClick);
  SearchButton = null;
  SearchStatus = false;
  clearTimeout(searchButtonTimeoutId);
  searchButtonTimeoutId = null;
  if (socket)
    socket.close();
}