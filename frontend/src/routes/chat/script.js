import config from "../../env/config.js";
import { getCookie } from "../../components/storage/script.js";
import { get_user } from "../../components/user/script.js";

let chatSocket = null;

export async function initComponent() {
    chatSocket = new WebSocket(config.websocketurl + '/ws/chat/');


    chatSocket.onmessage = function (e) {
        const data = JSON.parse(e.data);
        document.querySelector('#chat-log').value += (data.message + '\n');
    };

    chatSocket.onclose = function (e) {
        console.error('Chat socket closed unexpectedly');
    };

    document.querySelector('#chat-message-input').focus();
    document.querySelector('#chat-message-input').onkeyup = function (e) {
        if (e.key === 'Enter')
            document.querySelector('#chat-message-submit').click();
    };

    document.querySelector('#chat-message-submit').onclick = function (e) {
        const messageInputDom = document.querySelector('#chat-message-input');
        const message = messageInputDom.value;
        chatSocket.send(JSON.stringify({
            'message': message
        }));
        messageInputDom.value = '';
    };
}

export async function cleanupComponent() {
    chatSocket.close();
    chatSocket = null;
}
