import { get_user } from '../.././components/user/script.js';
import { getCookie } from '../.././components/storage/script.js';
import config from '../../env/config.js';

await get_user();
let userCookie = getCookie('user');
const user = JSON.parse(userCookie);
console.log(user);
if (!user)
  window.location.href = '/login';

let pongSocket = new WebSocket(config.websocketurl + "/ws/pong");

pongSocket.onopen = function () {
  console.log("Connected to the pong websocket");
}

pongSocket.onmessage = function (event) {
  let data = JSON.parse(event.data);
  console.log(data);
}

pongSocket.onclose = function () {
  console.log("Disconnected from the pong websocket");
}