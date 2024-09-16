import config from "../../env/config.js";
import { getCookie } from "../../components/storage/script.js";
import { get_user } from "../../components/user/script.js";

await get_user();
let userCookie = getCookie('user');
if (!userCookie)
    window.location.href = '/login';

else {
    const user = JSON.parse(userCookie);
    let access_token = getCookie('access_token');
    console.log(access_token);
    
    let chatSocket = new WebSocket(config.websocketurl + "/ws/chat/", ["token", access_token]);
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
}