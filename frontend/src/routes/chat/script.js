import config from "../../env/config.js";
import { getCookie } from "../../components/storage/script.js";

// acces_token = getCookie("acces_token");
let chatSocket = new WebSocket(config.websocketurl + "/ws/chat/");

chatSocket.onmessage = function(e)
{
    const data = JSON.parse(e.data);
    document.querySelector('#chat-log').value += (data.message + '\n');
};

chatSocket.onclose = function(e)
{
    console.error('Chat socket closed unexpectedly');
};

document.querySelector('#chat-message-input').focus();
document.querySelector('#chat-message-input').onkeyup = function(e)
{
    if (e.key === 'Enter')
        document.querySelector('#chat-message-submit').click();
};

document.querySelector('#chat-message-submit').onclick = function(e)
{
    let acces_token = getCookie('acces_token');
    const messageInputDom = document.querySelector('#chat-message-input');
    const message = messageInputDom.value;
    chatSocket.send(JSON.stringify({
        'acces_token': acces_token,
        'message': message
    }));
    messageInputDom.value = '';
};