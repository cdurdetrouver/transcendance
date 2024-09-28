import config from "../../env/config.js";
import { get_user } from "../../components/user/script.js";

//create chat with a username or more -> upload a photo to the chat
//create a conf chat
//p'tit close chat 
//put gif in chat ? 
let chatSocket;

async function get_user_chats()
{
    const response = await fetch(config.backendUrl + "/user/chats/", {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
		},
		credentials: "include",
	});
    if (response.status === 200)
        {
            const data = await response.json();
            return data
        }
        return null;
}

async function send_conf_room(room_name) {
    
    console.log(room_name);
    const response = await fetch(config.backendUrl + "/chat/create_room/", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
		},
		credentials: "include",
        body: JSON.stringify({
             "room_name": room_name
        })
	});
    if (response.status === 200)
        {
            const data = await response.json();
            console.log(data);
            return ;
        }
        return null;
}

async function create_room() {
    const chat_container = document.querySelector('.create-box');
    const chat_btn = document.querySelector('.li-create-room-btn');
    const chat_conf = document.createElement('li');
    chat_btn.innerHTML=``;
    chat_conf.innerHTML=`
         <input class="chat-room-name" id="name" type="text" size="100"><br>
         <input class="chat-room-submit" id=""submit type="button" value="Create">
    `;
    chat_container.appendChild(chat_conf);
    const room_name = document.querySelector('.chat-room-name')
    document.querySelector('.chat-room-submit').addEventListener('click', function(event) {
        send_conf_room(room_name.value);
    });
}

//load html in chat box and open a connection with the backend to start the chat
async function open_chat(chat_id) {
    if (chatSocket) {
        chatSocket.close();
        const chatLog = document.getElementById('chat-log');
        chatLog.value = '';
    }
    else {
        const chat_box = document.querySelector('.chat-box');
        chat_box.innerHTML = `
            <textarea id="chat-log" cols="100" rows="20"></textarea><br>
            <input id="chat-message-input" type="text" size="100"><br>
            <input id="chat-message-submit" type="button" value="Send">
            <input id="chat-message-refresh" type="button" value="refresh">
            <input id="chat-message-close" type="button" value="close chat">
        `;
    }

    chatSocket = new WebSocket(config.websocketurl + "/ws/chat/" + chat_id + "/");
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
        console.log('Chat socket closed');
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
    document.querySelector('#chat-message-close').onclick = function(e)
    {
        if (chatSocket)
            chatSocket.close();
        const chat_box = document.querySelector('.chat-box');
        chat_box.innerHTML = ``;
    };
    document.querySelector('#chat-message-refresh').onclick = function(e)
    {
        chatSocket.send(JSON.stringify({
            'type': "refresh_mess",
        }));
    };
}

//here we get the list of chat from user and load it to the html
async function print_chats() {
    let rooms = await get_user_chats();

    if (!rooms)
    {
        const chat_error = document.querySelector('.chat-list');
        const error = document.createElement('li');
        error.innerHTML = `
        <div class="chat-info">
        <div>${"no chat found"}</div>
        </div>
        `;
        chat_error.appendChild(error);
    }
    else {
        for (const room of rooms.rooms)
            {
                const chat_list = document.querySelector('.chat-list');
                const chat = document.createElement('li');
                chat.id = room.id
                chat.innerHTML = `
                <div class="chat-block">
			    <div id=${room.id}>${room.name}</div>
                </div>
                `;
                chat.addEventListener('click', function(event) {
                        open_chat(room.id);
                });
                chat_list.appendChild(chat);
                console.log(room);
            };
        }//load html in chat box and open a connection with the backend to start the chat
}

print_chats()
const create_room_btn = document.querySelector('.li-create-room-btn');
create_room_btn.addEventListener('click', function(event) {
    create_room();
});


