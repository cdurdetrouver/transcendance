import config from "../../env/config.js";
import { getCookie } from "../../components/storage/script.js";
import { get_user } from "../../components/user/script.js";

// await get_user();
// let userCookie = getCookie('user');
// if (!userCookie)
//     window.location.href = '/login';

let chatSocket = new WebSocket(config.websocketurl + "/ws/chat/");
chatSocket.onmessage = function(e)
{
    const data = JSON.parse(e.data);
    console.log(data);
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
    const messageInputDom = document.querySelector('#chat-message-input');
    const message = messageInputDom.value;
    chatSocket.send(JSON.stringify({
        'message': message
    }));
    messageInputDom.value = '';
};
