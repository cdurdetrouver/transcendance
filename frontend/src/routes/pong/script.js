import config from '../../env/config.js';
import { get_user } from '../.././components/user/script.js';
import { customalert } from '../../components/alert/script.js';
import { router } from '../../app.js';

const checkImageSrc = "../../static/assets/yes.png";
const crossImageSrc = "../../static/assets/no.png";

let searchButtonTimeoutId = null;
let SearchButton = null;
let SearchStatus = false;
let socket = null;
let character = null;

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
      WaitingText.innerHTML = "";
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
      this.socket = new WebSocket(config.websocketurl + "/ws/pong/matchmaking/?character=" + character);
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
	let img = element.querySelector('img');
    if (!img) {
        img = document.createElement('img');
        element.appendChild(img);
    }
	img.src = svgContent;
}

function toggleSvgStatus(opponent = false, status = false) {
  if (opponent == true) {
    let div = document.getElementById('opponent');
    let userNameDiv = div.querySelector('.user__status');
    setSVGContent(userNameDiv, status ? checkImageSrc : crossImageSrc);
  }
  else {
    let div = document.getElementById('player');
    let userNameDiv = div.querySelector('.user__status');
    setSVGContent(userNameDiv, status ? checkImageSrc : crossImageSrc);
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
    WaitingText.innerHTML = "";
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

  let urlParams = new URLSearchParams(window.location.search);
  character = urlParams.get('character');
  if (!character) {
    customalert("Error", "Character not found", true);
    router.navigate('/character');
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