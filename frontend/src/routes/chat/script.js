import config from "../../env/config.js";
import { get_user } from "../../components/user/script.js";

//create a conf chat
//create a view room :  post create room  (add view add_user in create room function in front) check_si admin
//                      put modify room
//                      get:  get les infos de la room
//                      delete: remove room
//leave / join room
//create chat with a username or more -> upload a photo to the chat
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

async function created_room(room_name) {
    const create_box = document.querySelector('.create-box');
    create_box.innerHTML=`
		 <li class="li-create-room-btn">
			 <t1>Chat ${room_name} succesfully created</t1>
            <input class="chat-conf-close" id=""submit type="button" value="Close">
		 </li>
    `;
    document.querySelector('.chat-conf-close').addEventListener('click', close_conf_room);

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
        created_room(data['room_name']);
        return ;
    }
    else if (response.status === 303)
    {
        console.log("Room already exists.");
        return;
    }
    return;
}

async function close_create_room() {
    const create_box = document.querySelector('.create-box');
    create_box.innerHTML=`
		 <li class="li-create-room-btn">
			<input id="create-room-btn" type="button" value="create room">
		 </li>
    `;
    const create_room_btn = document.querySelector('.li-create-room-btn');
    create_room_btn.addEventListener('click', create_room);
    print_chats();
}

async function create_room() {
    const create_box = document.querySelector('.create-box');
    create_box.innerHTML=`
        <li class="li-create-room-btn">
            <input class="chat-room-name" id="name" type="text" size="100"><br>
            <input class="chat-room-submit" id=""submit type="button" value="Create">
            <input class="chat-conf-close" id=""submit type="button" value="Close">
		</li>
    `;
    const room_name = document.querySelector('.chat-room-name')
    document.querySelector('.chat-room-submit').addEventListener('click', function(event) {send_conf_room(room_name.value)});
    document.querySelector('.chat-conf-close').addEventListener('click', close_create_room);
}

async function add_user(username) {
    
}

async function chat_add_user(params) {
    const chat_conf = document.querySelector('.chat-conf');
    chat_conf.innerHTML = `
        <input id="chat-user-input" type="text" size="100" value="username"><br>
        <input id="chat-user-submit" type="button" value="add user">
        <input id="chat-user-add-close" type="button" value="close">
    `;
    input_user = document.querySelector('#id_chat-user-submit')
    document.querySelector('#id_chat-user-submit').addEventListener('click', function(event) {add_user(input_user.value)});
    document.querySelector('#id_chat-user-add-close').addEventListener('click', function(event) {open_conf()});
}

async function chat_remove_user(params) {
    const chat_conf = document.querySelector('.chat-conf');
    chat_conf.innerHTML = `
     <input id="chat-conf" type="button" value="chat conf">
    `;
    document.querySelector('.chat-conf').addEventListener('click', function(event) {open_conf()});
}

async function chat_change_name(params) {
    const chat_conf = document.querySelector('.chat-conf');
    chat_conf.innerHTML = `
     <input id="chat-conf" type="button" value="chat conf">
    `;
    document.querySelector('.chat-conf').addEventListener('click', function(event) {open_conf()});
}

async function chat_change_photo(params) {
    const chat_conf = document.querySelector('.chat-conf');
    chat_conf.innerHTML = `
     <input id="chat-conf" type="button" value="chat conf">
    `;
    document.querySelector('.chat-conf').addEventListener('click', function(event) {open_conf()});
}

async function chat_delete(params) {
    const chat_conf = document.querySelector('.chat-conf');
    chat_conf.innerHTML = `
     <input id="chat-conf" type="button" value="chat conf">
    `;
    document.querySelector('.chat-conf').addEventListener('click', function(event) {open_conf()});
}

async function chat_close_conf(params) {
    const chat_conf = document.querySelector('.chat-conf');
    chat_conf.innerHTML = `
     <input id="chat-conf" type="button" value="chat conf">
    `;
    document.querySelector('.chat-conf').addEventListener('click', function(event) {open_conf()});
}

async function open_conf(params) {
    const chat_conf = document.querySelector('.chat-conf');
    chat_conf.innerHTML = `
        <input id="chat-add-user" type="button" value="Add user">
        <input id="chat-remove-user" type="button" value="Remove user">
        <input id="chat-change-name" type="button" value="Change name">
        <input id="chat-change-photo" type="button" value="Change photo">
        <input id="chat-delete" type="button" value="Delete chat">
        <input id="chat-conf-close" type="button" value="Close conf chat">
    `;
    document.querySelector('#id_chat-add-user').addEventListener('click', function(event) {chat_add_user()});
    document.querySelector('#id_chat-remove-user').addEventListener('click', function(event) {chat_remove_user()});
    document.querySelector('#id_chat-change-name').addEventListener('click', function(event) {chat_change_name()});
    document.querySelector('#id_chat-change-photo').addEventListener('click', function(event) {chat_change_photo()});
    document.querySelector('#id_chat-delete').addEventListener('click', function(event) {chat_delete()});
    document.querySelector('#id_chat-conf-close').addEventListener('click', function(event) {chat_close_conf()});
}

//load html in chat box and open a connection with the backend to start the chat
async function open_chat(chat_id, chat_name) {
    if (chatSocket) {
        chatSocket.close();
        const chatLog = document.getElementById('chat-log');
        if (chatLog)
            chatLog.value = '';
    }
    const chat_box = document.querySelector('.chat-box');
    chat_box.innerHTML = `
        <li>
        <t1>Chat ${chat_name} selected</t1>
		</li>
        <li class="chat-conf">
        <input id="chat-conf" type="button" value="chat conf">
		</li>
        <li>
        <textarea id="chat-log" cols="100" rows="20"></textarea><br>
        <input id="chat-message-input" type="text" size="100"><br>
        <input id="chat-message-submit" type="button" value="Send">
        <input id="chat-message-refresh" type="button" value="refresh">
        <input id="chat-message-close" type="button" value="close chat">
		</li>
    `;
    document.querySelector('.chat-conf').addEventListener('click', function(event) {open_conf()});

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
            for (const index in data.messages)
                document.querySelector('#chat-log').value += (data.messages[index].content + '\n');
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
        chat_box.innerHTML = `<t1>No chat selected</t1>`;
    };
    document.querySelector('#chat-message-refresh').onclick = function(e)
    {
        chatSocket.send(JSON.stringify({
            'type': "refresh_mess",
        }));
    };const response = await fetch(config.backendUrl + "/user/chats/", {
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
        const chat_list = document.querySelector('.chat-list');
        chat_list.innerHTML=`
            <t1>List of chat</t1>
        `;
        for (const room of rooms.rooms)
            {
                const chat = document.createElement('li');
                chat.id = room.id
                chat.innerHTML = `
                <div class="chat-block">
			    <div id=${room.id}>${room.name}</div>
                </div>
                `;
                chat.addEventListener('click', function(event) {
                    open_chat(room.id, room.name);
            });
                chat_list.appendChild(chat);
                console.log(room);
            };
        }
}

export async function initComponent(params) {
    let user = await get_user();
    if (!user)
        router.navigate('/login?return=/chat');
    print_chats()
    const create_room_btn = document.querySelector('.li-create-room-btn');
    create_room_btn.addEventListener('click', create_room);
}

export async function cleanupComponent(params) {
    if (chatSocket)
        chatSocket.close();
    const container = document.querySelector('.chat_container');
    container.replaceWith(container.cloneNode(true));
}