import config from "../../env/config.js";
import { get_user, searchUsers } from "../../components/user/script.js";
import { router } from '../../app.js';
import {customalert} from '../../components/alert/script.js';

let chatSocket;
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
    const data = await response.json();
    if (response.status === 200) {
            return data;
    }
    if (response.status === 404) {
        console.log("error: ", data['error'])
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
    const data = await response.json();
    if (response.status === 200) {
            return data
    }
    if (response.status === 404) {
        console.log("error: ", data['error'])
    }
    return null;
}

async function send_create_room(event) {
	event.preventDefault();
    const form = event.target
    console.log(form);
    const form_data = new FormData(form);
    console.log(form_data);

    const response = await fetch(config.backendUrl + "/chat/room/" + 0, {
        method: "POST",
        body: form_data,
		credentials: "include",
	});
    const data = await response.json();
    if (response.status === 200) {
        const c_room = data['room'];
        close_create_room();
        customalert('Chat created !', c_room.name + ' has been created');
        print_chats();  
        return;
    }
    else if (response.status === 404 || response.status === 403 || response.status === 400 || response.status === 303) {
        console.log("error: ", data['error'])
    }
    return;
}

async function close_create_room() {
    const create_box = document.querySelector('.create-box');
    create_box.innerHTML=`
		 <div class="create-room">
			<input id="create-room-btn" type="button" value="create room">
		 </div>
    `;
    const create_room_btn = document.querySelector('.create-room');
    create_room_btn.addEventListener('click', create_room);
}

async function create_room() {
    const create_box = document.querySelector('.create-box');
    create_box.innerHTML=`
        <div class="create-room-form">
            <form id="roomForm" class="room__form">
                <label for="room_name"></label>
                <input type="text" class="input-text-chat" name="name" placeholder="Enter room name" required><br><br>
                
                <label for="room_picture">Room Picture:</label><br>
                <div class="form-row">
                    <div class="new-pic">
                        <input type="file" class="room_picture" name="room_picture" accept="image/*">
                    </div>
                    <div class="validate">
                        <button id="validate-room" type="submit">test</button>
                    </div>
                    <div class="close-element">
                        <input class="chat-conf-close" type="button" value="Close">
                    </div>
                </div>
            </form>
        </div>
    `;
	document.getElementById('roomForm').addEventListener('submit', send_create_room);
    document.querySelector('.chat-conf-close').addEventListener('click', close_create_room);
}

async function toggleDisplay(element, displayStyle) {
    const userList = document.querySelector(element);
	console.log(userList);
	if (userList) {
        userList.style.display = displayStyle;
    } else {
        console.warn(`Element with selector "${element}" not found.`);
		console.log(document.querySelector(element));
    };
}

async function add_user(username) {
    console.log(room.name);
    const response = await fetch(config.backendUrl + "/chat/users_management/", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
		},
		credentials: "include",
        body: JSON.stringify({
            "room_id" : room.id,
            "username": username
        })
	});
    const data = await response.json();
    if (response.status === 200) {
			toggleDisplay('.lower-left', "none");
			open_conf();
            console.log("add user request succes: " + data['User status']);
			customalert('Invitation sent', 'Plz say yes ' + username + ' !', false);
    }
    else if (response.status === 303 || response.status === 404 || response.status === 403) {
            console.log("add user request: " + data['error']);
			customalert(data['error'], 'No friend for U lol' , true);
    }
    return;
}

async function chat_add_user() {
	toggleDisplay('.lower-left', "flex");
    const chat_conf = document.querySelector('.chat-conf');
    chat_conf.innerHTML = `
	<h3>Group configuration</h3>
	<div id="user-add-remove-block">
		<div id="chat-add-user">
			<input id="button-add-user" type="button" value="Add user">
		</div>
	</div>
   	<input id="chat-user-input" type="text" size="100" placeholder="username">
	<input id="chat-user-submit" type="button">
    <input id="chat-conf-close" type="button">
    `;

	document.getElementById('chat-user-input').addEventListener('input', async function() {
		const query = this.value;
		if (query.length > 0) {
			const response = await searchUsers(query, 5);
			if (response.status === 200) {
				const data = await response.json();
				updateUserList(data.users);
			} else {
				updateUserList([]);
			}
		} else {
			updateUserList([]);
		}
	});

    const input_user = document.querySelector('#chat-user-input');
    document.querySelector('#chat-user-submit').addEventListener('click', function(event) {
		add_user(input_user.value, room)
	});
    document.querySelector('#chat-conf-close').addEventListener('click', function(event) {
		open_conf()
		toggleDisplay('.lower-left', "none");
	});
}

async function remove_user(username) {
    const response = await fetch(config.backendUrl + "/chat/users_management/", {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
		},
		credentials: "include",
        body: JSON.stringify({
            "room_id" : room.id,
             "username": username
        })
	});
    let ret;
    const data = await response.json();
    if (response.status === 200) {
			toggleDisplay('.lower-left', "none");
			customalert('User removed', 'Goodbye ' + username + ', nobody liked you', false);
            console.log("Remove user request succes: " + data['User status']);
            ret = data['User status'];
        }
    if (response.status === 404 || response.status === 403 || response.status === 400) {
                console.log("error: " + data['error']);
				customalert(data['error'], 'Learn to write, noob' , true);
                ret = data['error'];
    }
}

async function chat_remove_user() {
	toggleDisplay('.lower-left', "flex");
    const chat_conf = document.querySelector('.chat-conf');
    chat_conf.innerHTML = `
	<h3>Group configuration</h3>
	<div id="user-add-remove-block">
		<div id="chat-add-user">
			<input id="button-remove-user" type="button" value="Remove user">
		</div>
	</div>
   	<input id="chat-user-input" type="text" size="100" placeholder="username">
	<input id="chat-user-submit" type="button">
    <input id="chat-conf-close" type="button">
    `;

	document.getElementById('chat-user-input').addEventListener('input', async function() {
		const query = this.value;
		if (query.length > 0) {
			const response = await searchUsers(query, 5);
			if (response.status === 200) {
				const data = await response.json();
				updateUserList(data.users);
			} else {
				updateUserList([]);
			}
		} else {
			updateUserList([]);
		}
	});
    const input_user = document.querySelector('#chat-user-input');
    document.querySelector('#chat-user-submit').addEventListener('click', function(event) {
		remove_user(input_user.value, room)
	});
    document.querySelector('#chat-conf-close').addEventListener('click', function(event) {
		open_conf()
		toggleDisplay('.lower-left', "none");
	});
}

async function update_room(event) {
    event.preventDefault();
    const form = event.target
    const form_data = new FormData(form);

    const response = await fetch(config.backendUrl + "/chat/room/" + room.id, {
        method: "PUT",
        body: form_data,
		credentials: "include",
	});
    const data = await response.json();
    if (response.status === 200) {
        room = data['room'];
		const chat_title = document.querySelector('#chat-header .room-name')
        chat_title.innerHTML = `
        ${room.name}
        `;
        customalert("Room updated", "a new day, a new style !");
        print_chats();
    }
    else if (response.status === 404 || response.status === 400 || response.status === 403) {
        console.log(data['error']);
    }
    return; 
}

async function chat_close(params) {
    const chat_box = document.querySelector('.chat-block');
    const middle_block = document.querySelector(".middle");
    middle_block.innerHTML =`
    <div class="chat-block"></div>
    `;
    const block_r = document.querySelector(".right");
    block_r.innerHTML =`
	<div class="room-info"></div>
	<div id="user-profile"></div>
	<div class="room-users"></div>
	<div class="chat-conf"></div>
	<div class="lower-left">
    <ul class="user-list"></ul>
	</div>
	`;
    chatSocket.close();
    print_chats();
}

async function chat_delete(event) {
    event.preventDefault();

    const response = await fetch(config.backendUrl + "/chat/room/" + room.id, {
        method: "DELETE",
		credentials: "include",
	});
    const data = await response.json();
    if (response.status === 200) {
        console.log(`Chat ${room.id} deleted successfully.`);
	    const chat_delete = document.querySelector('.chat-block');
        customalert("Chat deleted", room.name + " was obliterated !")
        chat_close();
        if (chatSocket)
            chatSocket.close();
    }
    else if (response.status === 404 || response.status === 403 || response.status === 400) {
        console.log(data['error'])
    }
    return;
}

async function chat_close_conf() {
    const chat_conf = document.querySelector('.chat-conf');
    chat_conf.innerHTML = `
     <input id="chat-conf-close" type="button" value="chat conf">
    `;
    document.querySelector('#chat-conf-close').addEventListener('click', function(event) {open_conf();});
}

async function check_admin() {
    const response = await fetch(config.backendUrl + "/chat/admin/" + room.id, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
		},
		credentials: "include",
	});
    const data = await response.json();
    if (response.status === 200) {
            console.log(data['User status']);
            return true;
    }
    else if (response.status === 404 || response.status === 403 || response.status === 400) {
            console.log(data['error']);
			return false;
    }
    return false;
}

async function leave_chat(params) {
    await remove_user(user.username);
    chat_close();
}

async function send_pong_link(params) {
    chatSocket.send(JSON.stringify({
        'type': "invitation",
    }));}

async function open_chat_info(room, room_picture) {

	const room_info = document.querySelector('.room-info');
	room_info.innerHTML = `
	<h1>Group info</h1>
	<div class="leave-room">
		<input id="chat-message-leave" type="button" value="leave chat">
	</div>
	`
}

async function open_conf() {
    const chat_conf = document.querySelector('.chat-conf');
    chat_conf.innerHTML = `
		<h3>Group configuration</h3>
		<div id="user-add-remove-block">
			<div id="chat-add-user">
				<input id="button-add-user" type="button" value="Add user">
			</div>
			<div id="chat-remove-user">
				<input id="button-remove-user" type="button" value="Remove user">
			</div>
		</div>
        <form id="roomConfForm" class="room__form">
			<label for="room_name">Name:</label>
			<input type="text" class="input-text-chat" name="name" value=${room.name}><br><br>

			<label for="room_picture">New Room Picture:</label><br><br>
			<div class="new-pic">
				<input type="file" class="room_picture" name="room_picture" accept="image/*">
			</div>
			<div id="submit-delete-block">
				<button type="submit" id="submit-edit">Update</button>
				<input id="chat-delete" type="button" value="Delete">
			</div>
	    </form>
        <input id="chat-conf-close" type="button" value="Close conf chat" style="display:none;">
        `;
	document.getElementById('roomConfForm').addEventListener('submit', update_room);
    document.getElementById('chat-add-user').addEventListener('click', chat_add_user);
    document.getElementById('chat-remove-user').addEventListener('click', chat_remove_user);
    document.getElementById('chat-delete').addEventListener('click', chat_delete);
    document.getElementById('chat-conf-close').addEventListener('click', chat_close_conf);
}

async function open_chat(room_selected) {
    if (chatSocket) {
        chatSocket.close();
        const chatLog = document.getElementById('chat-log');
        if (chatLog)
            chatLog.value = '';
    }
    room = room_selected;
    console.log(room);
    const chat_box = document.querySelector('.chat-block');
	const chat_conf = document.querySelector('.chat-conf');
	let room_picture = config.backendUrl + room.room_picture;
	if (room.room_picture == null)
		room_picture = "../../static/assets/jpg/default_picture.jpg"

    chat_box.innerHTML = `
	<div class="chat-output-block">
		<div id=chat-header> 
			<span class="room-pic"> <img src="${room_picture}" height=100 alt="Room Picture"> </span>
			<span class="room-name">${room.name}</span>
		</div>
		<div id="chat-log" style="overflow-y: auto; max-height: 80%;"></div>
	</div>
	<div id="chat-input-block">	
		<input id="chat-message-input" type="text" placeholder="Aa"><br>
		<input id="chat-message-pong" type="button">
	</div>
	<input id="chat-message-submit" type="button" value="Send">
    `;
    const chat_log =  document.getElementById('chat-log');
    let first_mess = true;
    let end_hist = false;
    chat_log.onscroll = function (e) {
        if (chat_log.scrollTop <= 20 && !end_hist){
            chatSocket.send(JSON.stringify({
                'type': "refresh_mess",
            }));
        }
    };
    chat_log.scrollTop = chat_log.scrollHeight;
    if (await check_admin() == true)
    {
        toggleDisplay(".chat-conf","")
		open_conf();
    }
    else
        toggleDisplay(".chat-conf","none")
	
	open_chat_info(room, room_picture);
	print_member(room);

    document.querySelector('#chat-message-pong').addEventListener('click', send_pong_link);
    document.querySelector('#chat-message-leave').addEventListener('click', leave_chat);


    chatSocket = new WebSocket(config.websocketurl + "/ws/chat/" + room.id + "/");
    chatSocket.onmessage = function(e)
    {
        const data = JSON.parse(e.data);
        console.log(data);
        if (data.type == 'announce') {
            const messageElement = document.createElement('p');
            const chat_log = document.querySelector('#chat-log')
			const chat = document.createElement('div');

			messageElement.classList.add('chat-message');
            messageElement.textContent = `${data.content}`;
            messageElement.classList.add('announce');

            chat.appendChild(messageElement);
            chat_log.appendChild(chat);
			chat_log.scrollTop = chat_log.scrollHeight;

        }
        else if (data.type == 'chat')
		{
			const chatLog = document.querySelector('#chat-log');
			const username = data.message.author.username;
			const content = data.message.content;

			const messageElement = document.createElement('p');
			const chat = document.createElement('div');
			messageElement.classList.add('chat-message');
			messageElement.textContent = `${content}`;
		
			const profile_picture =  data.message.author.picture_remote ?  data.message.author.picture_remote : config.backendUrl +  data.message.author.profile_picture;


			const profileImg = document.createElement('img');
			profileImg.src = profile_picture;
			profileImg.alt = `${username}'s profile picture`; 
			profileImg.classList.add('profile-pic'); 

			const nameDiv = document.createElement('div');
			nameDiv.classList.add('nameDiv');
			nameDiv.innerHTML = `<span>${username}</span>`; 
			nameDiv.querySelector('span').insertAdjacentElement('afterbegin', profileImg);

			chat.appendChild(nameDiv);
			chat.appendChild(messageElement);

            chatLog.appendChild(chat);
			chatLog.scrollTop = chatLog.scrollHeight;

		}
		else if (data.type == 'list-chat') {
            if (data.messages[0] == null) {
                end_hist = true;//end of history
                return;
            }
			const chatLog = document.querySelector('#chat-log');
            data.messages.reverse();
            let last_height_chat = chat_log.scrollHeight;
			for (const index in data.messages) {
				const message = data.messages[index];
				const username = message.author ? message.author.username : "";
				const messageElement = document.createElement('p');
				const chat = document.createElement('div');
				messageElement.classList.add('chat-message');
                
                messageElement.textContent = `${message.content}`;
                if (!message.author) {
                    messageElement.classList.add('announce');
                }
                if (message.author) {
					const profile_picture = message.author.picture_remote ? message.author.picture_remote : config.backendUrl + message.author.profile_picture;
					const profileImg = document.createElement('img');
					profileImg.src = profile_picture;
					profileImg.alt = `${username}'s profile picture`;
					profileImg.classList.add('profile-pic'); 

					const nameDiv = document.createElement('div');
					nameDiv.classList.add('nameDiv');
					nameDiv.innerHTML = `<span>${username}</span>`;
					nameDiv.querySelector('span').insertAdjacentElement('afterbegin', profileImg);
					chat.appendChild(nameDiv);
				}
                chat.appendChild(messageElement);
                chatLog.prepend(chat);
            }
            chat_log.scrollTop = chat_log.scrollHeight - last_height_chat;
		}
		
        else if (data.type == 'invitation') {
			const chatLog = document.querySelector('#chat-log');
			const username = data.message && data.message.author ? data.message.author.username : 'Unknown User';
			const invitationLink = `${config.frontendUrl}/character?match_name=${data.match_name}`; 
	
			// Create message element
			const messageElement = document.createElement('div');
			messageElement.classList.add('chat-message');
			
			// Create clickable link for the invitation
			const linkElement = document.createElement('a');
			linkElement.href = invitationLink;
			linkElement.classList.add('gamek-link'); // Add your styles here
			linkElement.innerHTML = `A pong room was created!<br>Click to join`; // Use innerHTML for line break
			linkElement.target = "_blank"; // Opens link in a new tab
			
			// Append the link to the message element
			messageElement.appendChild(linkElement);

			// Append the message element to the chat log
			chatLog.appendChild(messageElement);
			chatLog.appendChild(messageElement);
            chat_log.scrollTop = chat_log.scrollHeight;
        }
		else if (data.type == 'error') {
			customalert('error !', 'Message too longs', true);
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
		if (message == ''){
			console.log("coucou");
			return;
		}
        chatSocket.send(JSON.stringify({
            'type': "chat",
            'message': message
        }));
        messageInputDom.value = '';
    };
}

async function print_chats() {
    const ret_rooms = await get_user_chats();
    if (!ret_rooms)
        {
            const chat_error = document.querySelector('.chat-names');
            chat_error.innerHTML = `
            <div class="chat-info">
                <h2>no chat found</h2>
            </div>
            `;
        }
    else {
        const rooms = ret_rooms.rooms
        const chat_list = document.querySelector('.chat-names');
		chat_list.innerHTML = ``;
        for (const room_l of rooms)
            {				
                const chat = document.createElement('li');
                chat.id = room_l.id
                let room_picture = config.backendUrl + room_l.room_picture;
				if (room_l.room_picture == null)
				{
					room_picture = "../../static/assets/jpg/default_picture.jpg"
				}
					chat.innerHTML = `
                <li class="room">
				    <span class="room-pic"> <img src="${room_picture}" height=100 alt="Room Picture"> </span>
			        <span class="room-name-left">${room_l.name}</span>
                </li>
                `;
                chat.addEventListener('click', function(event) {
                    open_chat(room_l);
            });
                chat_list.appendChild(chat);
                console.log(room_l);
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
    if (response.status === 200) {
            console.log("invitation: ", data['invitation'])
            print_chats();
            print_invitations();
    }
    else if (response.status === 400 || response.status === 404 || response.status === 403){
        console.log("error: ", data['error'])
    }
	const roomid = ".room.room-id-" + room_id;
	console.log(roomid);
	toggleDisplay(roomid, "none")
        return;   
}

async function print_invitations() {
    const ret_rooms = await get_user_invitations();
    if (!ret_rooms)
        {
            const no_invit = document.querySelector('.invitation');

			const newH2 = document.createElement('h4');
			newH2.textContent = 'No invitation, sorry :('; // Set the content of the new h2

			const h1Element = no_invit.querySelector('h1');
			h1Element.insertAdjacentElement('afterend', newH2);
        }
    else {
        const rooms = ret_rooms.invitation;
        const invite_list = document.querySelector('.invitation-list');
        for (const room_l of rooms)
            {
                const invite = document.createElement('li');
                let room_picture = config.backendUrl + room_l.room_picture;
				if (room_l.room_picture == null)
					room_picture = "../../static/assets/jpg/default_picture.jpg"
                invite.innerHTML = `
				<li class="room room-id-${room_l.id}">
				    <span class="room-pic"> <img src="${room_picture}" height=100 alt="Room Picture"> </span>
			        <span class="room-name-left">${room_l.name}</span>
					<input id="invitation-accept-${room_l.id}" class="invite-yes" type="button" >
					<input id="invitation-refuse-${room_l.id}" class="invite-no" type="button">
                </li>
                `;
                invite_list.appendChild(invite);
				const btn_accept = document.getElementById(`invitation-accept-${room_l.id}`)
				const btn_refuse = document.getElementById(`invitation-refuse-${room_l.id}`)
				btn_accept.addEventListener('click', function(event) {accept_invitation(room_l.id, "TRUE")});
				btn_refuse.addEventListener('click', function(event) {accept_invitation(room_l.id, "FALSE")});

				invite.addEventListener('click', function(event) {
						open_invitation(room_l);
				});
            };
        }
}

export async function mp_somebody(user_id) {

    const response = await fetch(config.backendUrl + "/chat/room/" + 0, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
		},
        body: JSON.stringify({
            "type": "mp",
            "recepient_id" : user_id,
        }),
		credentials: "include",
	});
    const data = await response.json();
    if (response.status === 200)
    {
        console.log(data["room_status"])
        return ;
    }
    else if (response.status === 303 || response.status === 404 ||response.status === 403 ||response.status === 400)
    {
        console.log("error mp: ", data["error"]);
        return;
    }
    return;
}

export async function initComponent(params) {
    user = await get_user();
    if (!user)
        router.navigate('/');
    print_chats();
    print_invitations();
    const create_room_btn = document.querySelector('.create-room');
    create_room_btn.addEventListener('click', create_room);

	// document.getElementById('user-search').addEventListener('input', async function() {
	// 	const query = this.value;
	// 	if (query.length > 0) {
	// 		const response = await searchUsers(query, 5);
	// 		if (response.status === 200) {
	// 			const data = await response.json();
	// 			updateUserList(data.users);
	// 		} else {
	// 			updateUserList([]);
	// 		}
	// 	} else {
	// 		updateUserList([]);
	// 	}
	// });
}

export async function cleanupComponent(params) {
    if (chatSocket)
        chatSocket.close();
    const container = document.querySelector('.background');
    container.replaceWith(container.cloneNode(true));
}


function updateUserList(users) {
	const userList = document.querySelector('.user-list');
	userList.innerHTML = '';
	users.forEach(user => {
		const userItem = document.createElement('li');
		const profile_picture = user.picture_remote ? user.picture_remote : config.backendUrl + user.profile_picture;

		userItem.innerHTML = `
		<li class="room" >
			<span class="room-pic"> <img src="${profile_picture}" height=100 alt="Room Picture"> </span>
			<span class="room-name-left">${user.username}</span>
		</li>
		`
		userItem.addEventListener('click', () => {
			document.getElementById('chat-user-input').value = user.username;
		});
		userList.appendChild(userItem);
	});
}


function open_invitation(room_l) {
	room = room_l;

	const room_info = document.querySelector('.room-info');

	room_info.innerHTML = `
	<h1>Group info</h1>
	<div class="leave-room"><div>
	`
	print_member(room);
}

function print_member(room) {
	const userList = document.querySelector('.room-users');
	userList.innerHTML = '';
	room.participants.forEach(user => {
		const userItem = document.createElement('li');
		userItem.classList.add('room');

		const profile_picture = user.picture_remote ? user.picture_remote : config.backendUrl + user.profile_picture;
		if (room.created_by && user.username == room.created_by.username)
		{
			userItem.innerHTML = `
				<span class="room-pic"> <img src="${profile_picture}" height=100 alt="Room Picture"> </span> 
				<span class="room-name-left">${user.username} (admin)</span>
			`;
		}
		else {
			userItem.innerHTML = `
				<span class="room-pic"> <img src="${profile_picture}" height=100 alt="Room Picture"> </span> 
				<span class="room-name-left">${user.username}</span>
			`;
		}
		userList.appendChild(userItem);
	});
}
