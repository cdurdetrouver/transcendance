import config from "../../env/config.js";
import { get_user } from "../../components/user/script.js";

let user = await get_user();
if (!user)
    window.location.href = '/login';
 
let chatSocket = new WebSocket(config.websocketurl + "/ws/chat/");
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
            document.querySelector('#chat-log').value += (data.messages[message].content + '\n');
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
