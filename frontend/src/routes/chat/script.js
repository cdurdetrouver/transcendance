import config from "../../env/config.js";
import { get_user } from "../../components/user/script.js";
import { get_user_chats } from "../../components/chat/script.js";

let user = await get_user();
if (!user)
    window.location.href = '/login';

const urlParams = new URLSearchParams(window.location.search);
const room_id = urlParams.get('room_id');

let chatSocket = new WebSocket(config.websocketurl + "/ws/chat/" + room_id + "/");

chatSocket.onopen = function(e)
{
    rooms = get_user_chats()
}

chatSocket.onmessage = function(e)
{
    const data = JSON.parse(e.data);
    console.log(data);
    if (data.type == 'announce')
        document.querySelector('#chat-log').value += (data.content + '\n');
    else if (data.type == 'chat')
        document.querySelector('#chat-log').value += (data.message.content + '\n');
    else if (data.type == 'list-chat') {
        for (const message in data.messages)
            document.querySelector('#chat-log').value += (data.messages[message].message.content + '\n');
    }
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
        'type': "chat",
        'message': message
    }));
    messageInputDom.value = '';
};

document.querySelector('#chat-message-refresh').onclick = function(e)
{
    chatSocket.send(JSON.stringify({
        'type': "refresh_mess",
    }));
};