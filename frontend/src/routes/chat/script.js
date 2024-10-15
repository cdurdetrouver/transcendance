import config from "../../env/config.js";
import { get_user } from "../../components/user/script.js";

//test:
// block
// send mess
// join if not in
// 2 rooms same name

//show error si photo n'est pas au bon format

//create une room avec direct quelqu'un ? -> create room can take a list of user with already the same name
//pong link
//func remove user not clean
//clean globals vars

//for frontend team:
//refresh juste affiche les 10 d'avant mais ils ne sont pas avant dans la box
let chatSocket;
let room_name = "";
let room_id = 0;
let room;
let user;

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

async function get_user_invitations(params) {
    const response = await fetch(config.backendUrl + "/user/invitations/", {
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

async function created_room(room_name_created) {
    const create_box = document.querySelector('.create-box');
    create_box.innerHTML=`
		 <li class="li-create-room-btn">
			 <t1>Chat ${room_name_created} succesfully created</t1>
            <input class="chat-conf-close" id=""submit type="button" value="Close">
		 </li>
    `;
    document.querySelector('.chat-conf-close').addEventListener('click', close_create_room);

}

async function send_create_room(event) {
	event.preventDefault();
    const form = event.target
    const form_data = new FormData(form);

    const response = await fetch(config.backendUrl + "/chat/room/" + 42, {
        method: "POST",
        body: form_data,
		credentials: "include",
	});
    if (response.status === 200)
    {
        const data = await response.json();
        created_room(data['room_name']);
        print_chats();
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
}

async function create_room() {
    const create_box = document.querySelector('.create-box');
    create_box.innerHTML=`
        <li class="li-create-room-form">
            <form id="roomForm" class="room__form">
			    <label for="room_name">Room name:</label>
			    <input type="text" id="room_name" name="name" required>

			    <label for="room_picture">Room Picture:</label>
			    <input type="file" id="room_picture" name="room_picture" accept="image/*">

			    <button type="submit">Create</button>
	        </form>
            <input class="chat-conf-close" id=""submit type="button" value="Close">
		</li>
    `;
	document.getElementById('roomForm').addEventListener('submit', send_create_room);
    document.querySelector('.chat-conf-close').addEventListener('click', close_create_room);
}

async function add_user(username) {
    console.log(room_name);
    const response = await fetch(config.backendUrl + "/chat/users_management/", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
		},
		credentials: "include",
        body: JSON.stringify({
            "room_id" : room_id,
            "username": username
        })
	});
    const data = await response.json();
    if (response.status === 200) {
            console.log("add user request succes: " + data['User status']);
            const chat_conf = document.querySelector('.chat-conf');
            chat_conf.innerHTML = `
                <t1>${data['User status']}</t1>
                <input id="chat-add-user-close" type="button" value="close">
            `;
            document.querySelector('#chat-add-user-close').addEventListener('click', function(event) {open_conf()});
            return ;
        }
        else if (response.status === 303)
        {
            console.log("add user request succes: " + data['User status']);
            const chat_conf = document.querySelector('.chat-conf');
            chat_conf.innerHTML = `
                <t1>${data['User status']}</t1>
                <input id="chat-add-user-close" type="button" value="close">
            `;
            document.querySelector('#chat-add-user-close').addEventListener('click', function(event) {open_conf()});
            return ;
        }
        else if (response.status === 404 || response.status === 403)
        {
            console.log(data['error']);
            return;
        }
}

async function chat_add_user() {
    const chat_conf = document.querySelector('.chat-conf');
    chat_conf.innerHTML = `
    <input id="chat-user-input" type="text" size="100" placeholder="username"><br>
    <input id="chat-user-submit" type="button" value="add user">
    <input id="chat-conf-close" type="button" value="close">
    `;
    const input_user = document.querySelector('#chat-user-input');
    document.querySelector('#chat-user-submit').addEventListener('click', function(event) {add_user(input_user.value)});
    document.querySelector('#chat-conf-close').addEventListener('click', function(event) {open_conf()});
}

async function remove_user(username) {
    const response = await fetch(config.backendUrl + "/chat/users_management", {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
		},
		credentials: "include",
        body: JSON.stringify({
            "room_id" : room_id,
             "username": username
        })
	});
    if (response.status === 200)
        {
            const data = await response.json();
            console.log("Remove user request succes: " + data['User status']);
            return data['User status'];
        }
    if (response.status === 404)
            {
                const data = await response.json();
                console.log("Remove user request succes: " + data['User status']);
                return data['User status'];
            }
        else if (response.status === 404)
        {
            const data = await response.json();
            console.log(data['error']);
            return;
        }
}

async function chat_remove_user(params) {
    const chat_conf = document.querySelector('.chat-conf');
    chat_conf.innerHTML = `
        <input id="chat-user-input" type="text" size="100" placeholder="username"><br>
        <input id="chat-user-submit" type="button" value="remove user">
        <input id="chat-conf-close" type="button" value="close">
    `;
    const input_user = document.querySelector('#chat-user-input');
    document.querySelector('#chat-user-submit').addEventListener('click', function(event) {
        const ret = remove_user(input_user.value);
        const chat_conf = document.querySelector('.chat-conf');
        chat_conf.innerHTML = `
            <t1>${ret}</t1>
            <input id="chat-add-user-close" type="button" value="close">
        `;
        document.querySelector('#chat-add-user-close').addEventListener('click', function(event) {open_conf()});});
    document.querySelector('#chat-conf-close').addEventListener('click', function(event) {open_conf()});
}

async function update_room(event) {
    event.preventDefault();
    const form = event.target
    const form_data = new FormData(form);

    const response = await fetch(config.backendUrl + "/chat/room/" + room_id, {
        method: "PUT",
        body: form_data,
		credentials: "include",
	});
    const data = await response.json();
    if (response.status === 200)
    {
        room_name = data['room_name'];
	    const chat_title = document.getElementById('chat-name-title');
        chat_title.innerHTML = `
        <t1>Chat ${room_name} selected</t1>
        `;
        print_chats();
        return ;
    }
    else if (response.status === 303)
    {
        console.log(data['room_status']);
        return;
    }
    else if (response.status === 404) {
        console.log(data['error'])
        return
    }
    return; 
}

async function chat_close(params) {
    const chat_box = document.querySelector('.chat-box');
    chat_box.innerHTML = `<t1>No chat selected</t1>`;
    print_chats();
}

async function chat_delete(event) {
    event.preventDefault();

    const response = await fetch(config.backendUrl + "/chat/room/" + room_id, {
        method: "DELETE",
		credentials: "include",
	});
    const data = await response.json();
    if (response.status === 200)
    {
        room_name = data['room_name'];
	    const chat_delete = document.querySelector('.chat-box');
        chat_delete.innerHTML = `
        <t1>Chat ${room.name} deleted successfully.</t1>
        <input id="chat-conf-close" type="button" value="Close chat">
        `;
        document.querySelector('#chat-conf-close').addEventListener('click', chat_close);
        if (chatSocket)
            chatSocket.close();
        return ;
    }
    else if (response.status === 404) {
        console.log(data['error'])
        return
    }
}

async function chat_close_conf(params) {
    const chat_conf = document.querySelector('.chat-conf');
    chat_conf.innerHTML = `
     <input id="chat-conf-close" type="button" value="chat conf">
    `;
    document.querySelector('#chat-conf-close').addEventListener('click', function(event) {open_conf()});
}

async function open_conf() {
    const chat_conf = document.querySelector('.chat-conf');
    console.log(room);
    chat_conf.innerHTML = `
        <input id="chat-add-user" type="button" value="Add user">
        <input id="chat-remove-user" type="button" value="Remove user">
        <form id="roomConfForm" class="room__form">
			<label for="room_name">Room name:</label>
			<input type="text" id="room_name" name="name" value=${room_name}>

			<label for="room_picture">Room Picture:</label>
			<input type="file" id="room_picture" name="room_picture" value="${config.backendUrl + room.room_picture}" accept="image/*">

			<button type="submit">Update</button>
	    </form>
        <input id="chat-delete" type="button" value="Delete chat">
        <input id="chat-conf-close" type="button" value="Close conf chat">
        `;
	document.getElementById('roomConfForm').addEventListener('submit', update_room);
    document.querySelector('#chat-add-user').addEventListener('click', chat_add_user);
    document.querySelector('#chat-remove-user').addEventListener('click', chat_remove_user);
    document.querySelector('#chat-delete').addEventListener('click', chat_delete);
    document.querySelector('#chat-conf-close').addEventListener('click', chat_close_conf);
}

async function check_admin() {
    const response = await fetch(config.backendUrl + "/chat/admin/", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            
		},
		credentials: "include",
        body: JSON.stringify({
            "room_id" : room_id,
        })
	});
    if (response.status === 200)
        {
            const data = await response.json();
            room = data['room']
            console.log(data['User status']);
            open_conf();
            return ;
        }
        else if (response.status === 404 || response.status === 403)
        {
            const data = await response.json();
            console.log(data['error']);
            return;
        }
}

async function leave_chat(params) {
    remove_user(user.username);
    chat_close();
    print_chats();
}

//load html in chat box and open a connection with the backend to start the chat
async function open_chat(chat_id, chat_name) {
    if (chatSocket) {
        chatSocket.close();
        const chatLog = document.getElementById('chat-log');
        if (chatLog)
            chatLog.value = '';
    }
    room_name = chat_name;
    room_id = chat_id;
    const chat_box = document.querySelector('.chat-box');
    chat_box.innerHTML = `
        <li id='chat-name-title'>
            <t1>Chat ${chat_name} selected</t1>
		</li>
        <li>
            <div class="chat-conf">
                <input id="chat-conf-btn" type="button" value="chat conf">
            </div>
		</li>
        <li>
            <textarea id="chat-log" cols="100" rows="20"></textarea><br>
            <input id="chat-message-input" type="text" size="100" placeholder="Your message"><br>
            <input id="chat-message-submit" type="button" value="Send">
            <input id="chat-message-refresh" type="button" value="refresh">
            <input id="chat-message-close" type="button" value="close chat">
            <input id="chat-message-leave" type="button" value="leave chat">
		</li>
    `;
    document.querySelector('#chat-conf-btn').addEventListener('click', function(event) {check_admin()});
    document.querySelector('#chat-message-leave').addEventListener('click', function(event) {leave_chat()});

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
    document.querySelector('#chat-message-close').onclick = function chat_close(e)
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
    const ret_rooms = await get_user_chats();
    if (!ret_rooms)
        {
            const chat_error = document.querySelector('.chat-list');
            chat_error.innerHTML = `
            <t1>List of chat</t1>
            <div class="chat-info">
            <div>${"no chat found"}</div>
            </div>
            `;
        }
    else {
        const rooms = ret_rooms.rooms
        const chat_list = document.querySelector('.chat-list');
        chat_list.innerHTML=`
            <t1>List of chat</t1>
        `;
        for (const room of rooms)
            {
                const chat = document.createElement('li');
                chat.id = room.id
                const room_picture = config.backendUrl + room.room_picture;
                chat.innerHTML = `
                <div class="chat-invitations-${room.id}">
			        <t1>${room.name}</t1>
                    <img src="${room_picture}" height=100 alt="Room Picture">
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

async function accept_invitation(room_id, value) {
    const response = await fetch(config.backendUrl + "/user/invitations/", {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
		},
        body: JSON.stringify({
            "room_id": room_id,
            "value": value
        }),
		credentials: "include",
	});
    const data = await response.json();
    if (response.status === 200)
        {
            console.log("invitation: ", data['invitation'])
            print_chats();
            print_invitations();
            return
        }
    else {
        console.log("error: ", data['error'])
    }
        return;   
}

async function print_invitations() {
    const ret_rooms = await get_user_invitations();
    if (!ret_rooms)
        {
            const chat_error = document.querySelector('.chat-list-invitations');
            chat_error.innerHTML = `
            <t1>List of inviataions</t1>
            <div class="chat-info-invitations">
            <div>no invitations found</div>
            </div>
            `;
        }
    else {
        const rooms = ret_rooms.rooms_invitations
        const chat_list = document.querySelector('.chat-list-invitations');
        chat_list.innerHTML=`
            <t1>List of invitations</t1>
        `;
        for (const room of rooms)
            {
                const chat = document.createElement('li');
                chat.id = room.id
                const room_picture = config.backendUrl + room.room_picture;
                chat.innerHTML = `
                <div class="chat-block-invitations-${room.id}">
			        <t1>${room.name}</t1>
                    <img src="${room_picture}" height=100 alt="Room Picture">
                    <input id="invitation-accept-${room.id}" type="button" value="Accept invitation">
                    <input id="invitation-refuse-${room.id}" type="button" value="Refuse invitation">

                </div>
                `;
                chat_list.appendChild(chat);
                const btn_accept = document.getElementById(`invitation-accept-${room.id}`)
                const btn_refuse = document.getElementById(`invitation-refuse-${room.id}`)
                btn_accept.addEventListener('click', accept_invitation(room.id, "TRUE"));
                btn_refuse.addEventListener('click', accept_invitation(room.id, "FALSE"));
            };
        }
}

export async function initComponent(params) {
    user = await get_user();
    if (!user)
        router.navigate('/login?return=/chat');
    print_chats();
    print_invitations();
    const create_room_btn = document.querySelector('.li-create-room-btn');
    create_room_btn.addEventListener('click', create_room);
}

export async function cleanupComponent(params) {
    if (chatSocket)
        chatSocket.close();
    const container = document.querySelector('.chat_container');
    container.replaceWith(container.cloneNode(true));
}