import config from "../../env/config.js";
import { get_user, searchUsers } from "../../components/user/script.js";
import { router } from '../../app.js';

//show error si photo n'est pas au bon format

//for frontend team:
//pong link redirect to their link sent
//refresh juste affiche les 10 d'avant mais ils ne sont pas avant dans la box
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

async function created_room(c_room) {
    const create_box = document.querySelector('.create-box');
    create_box.innerHTML=`
		 <li class="li-create-room-btn">
			 <t1>Chat ${c_room.name} succesfully created</t1>
            <input class="chat-conf-close" id=""submit type="button" value="Close">
		 </li>
    `;
    document.querySelector('.chat-conf-close').addEventListener('click', close_create_room);
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
        created_room(c_room);
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
            console.log("add user request succes: " + data['User status']);
            const chat_conf = document.querySelector('.chat-conf');
            chat_conf.innerHTML = `
                <t1>${data['User status']}</t1>
                <input id="chat-add-user-close" type="button" value="close">
            `;
            document.querySelector('#chat-add-user-close').addEventListener('click', function(event) {open_conf()});
    }
    else if (response.status === 303 || response.status === 404 || response.status === 403) {
            console.log("add user request: " + data['error']);
            const chat_conf = document.querySelector('.chat-conf');
            chat_conf.innerHTML = `
                <t1>${data['User status']}</t1>
                <input id="chat-add-user-close" type="button" value="close">
            `;
            document.querySelector('#chat-add-user-close').addEventListener('click', function(event) {open_conf()});
    }
    return;
}

async function chat_add_user() {
    const chat_conf = document.querySelector('.chat-conf');
    chat_conf.innerHTML = `
    <input id="chat-user-input" type="text" size="100" placeholder="username"><br>
    <input id="chat-user-submit" type="button" value="add user">
    <input id="chat-conf-close" type="button" value="close">
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
    document.querySelector('#chat-user-submit').addEventListener('click', function(event) {add_user(input_user.value, room)});
    document.querySelector('#chat-conf-close').addEventListener('click', function(event) {open_conf()});
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
            console.log("Remove user request succes: " + data['User status']);
            ret = data['User status'];
        }
    if (response.status === 404 || response.status === 403 || response.status === 400) {
                console.log("error: " + data['error']);
                ret = data['error'];
    }
    return ret;
}

async function chat_remove_user() {
    const chat_conf = document.querySelector('.chat-conf');
    chat_conf.innerHTML = `
    <input id="chat-user-input" type="text" size="100" placeholder="username"><br>
    <input id="chat-user-submit" type="button" value="remove user">
    <input id="chat-conf-close" type="button" value="close">
    `;
    const input_user = document.querySelector('#chat-user-input');
    document.querySelector('#chat-user-submit').addEventListener('click', async function(event) {
        const ret = await remove_user(input_user.value, room);
        const chat_conf = document.querySelector('.chat-conf');
        chat_conf.innerHTML = `
        <t1>${ret}</t1>
        <input id="chat-add-user-close" type="button" value="close">
        `;
        document.getElementById('chat-add-user-close').addEventListener('click', open_conf);});
    document.querySelector('#chat-conf-close').addEventListener('click', function(event) {open_conf()});
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
        print_chats();
    }
    else if (response.status === 404 || response.status === 400 || response.status === 403) {
        console.log(data['error']);
    }
    return; 
}

async function chat_close(params) {
    const chat_box = document.querySelector('.chat-block');
    chat_box.innerHTML = `<t1>No chat selected</t1>`;
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
        chat_delete.innerHTML = `
        <t1>Chat ${room.name} deleted successfully.</t1>
        <input id="chat-conf-close" type="button" value="Close chat">
        `;
        document.querySelector('#chat-conf-close').addEventListener('click', chat_close);
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
    document.querySelector('#chat-conf-close').addEventListener('click', function(event) {open_conf()});
}

async function open_conf() {
    const chat_conf = document.querySelector('.chat-conf');
    chat_conf.innerHTML = `
        <input id="chat-add-user" type="button" value="Add user">
        <input id="chat-remove-user" type="button" value="Remove user">
        <form id="roomConfForm" class="room__form">
			<label for="room_name">Room name:</label>
			<input type="text" id="room_name" name="name" value=${room.name}>

			<label for="room_picture">Room Picture:</label>
			<input type="file" id="room_picture" name="room_picture" accept="image/*">

			<button type="submit">Update</button>
	    </form>
        <input id="chat-delete" type="button" value="Delete chat">
        <input id="chat-conf-close" type="button" value="Close conf chat">
        `;
	document.getElementById('roomConfForm').addEventListener('submit', update_room);
    document.getElementById('chat-add-user').addEventListener('click', chat_add_user);
    document.getElementById('chat-remove-user').addEventListener('click', chat_remove_user);
    document.getElementById('chat-delete').addEventListener('click', chat_delete);
    document.getElementById('chat-conf-close').addEventListener('click', chat_close_conf);
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
            open_conf();
    }
    else if (response.status === 404 || response.status === 403 || response.status === 400) {
            console.log(data['error']);
    }
    return;
}

async function leave_chat(params) {
    remove_user(user.username);
    chat_close();
    print_chats();
}

async function send_pong_link(params) {
    chatSocket.send(JSON.stringify({
        'type': "invitation",
    }));}

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
	const room_info = document.querySelector('.room-info');
	let room_picture = config.backendUrl + room.room_picture;
	if (room_picture == "http://localhost:8000null")
	{
		room_picture = "../../static/assets/jpg/default_picture.jpg"
	}

    chat_box.innerHTML = `
	<div id=chat-header> 
		<span class="room-pic"> <img src="${room_picture}" height=100 alt="Room Picture"> </span>
		<span class="room-name">${room.name}</span>
	</div>

            <div id="chat-log" style="overflow-y: auto; max-height: 80%;"></div>
			<div id="chat-input-block">
			    <input id="chat-message-input" type="text" placeholder="Aa"><br>
				<input id="chat-message-pong" type="button" value="Send pong link">
			</div>
            <input id="chat-message-submit" type="button" value="Send">
            <input id="chat-message-refresh" type="button" value="refresh">
            <input id="chat-message-close" type="button" value="close chat">
            <input id="chat-message-leave" type="button" value="leave chat">
    `;
	chat_conf.innerHTML = `
	<input id="chat-add-user" type="button" value="Add user">
	<input id="chat-remove-user" type="button" value="Remove user">
	<form id="roomConfForm" class="room__form">
		<label for="room_name">Room name:</label>
		<input type="text" id="room_name" name="name" value=${room.name}>

		<label for="room_picture">Room Picture:</label>
		<input type="file" id="room_picture" name="room_picture" accept="image/*">

		<button type="submit">Update</button>
	</form>
	<input id="chat-delete" type="button" value="Delete chat">
	<input id="chat-conf-close" type="button" value="Close conf chat">
	
	`;



	room_info.innerHTML = `
	<div class="room-pic"> <img src="${room_picture}" height=100 alt="Room Picture"> </div>
	<div class="room-name-right"> ${room.name}  </div>
	`

	print_member(room);

    // document.querySelector('#chat-conf-btn').addEventListener('click', check_admin);
    document.querySelector('#chat-message-pong').addEventListener('click', send_pong_link);
    document.querySelector('#chat-message-leave').addEventListener('click', leave_chat);

	document.getElementById('roomConfForm').addEventListener('submit', update_room);
    document.getElementById('chat-add-user').addEventListener('click', chat_add_user);
    document.getElementById('chat-remove-user').addEventListener('click', chat_remove_user);
    document.getElementById('chat-delete').addEventListener('click', chat_delete);
    document.getElementById('chat-conf-close').addEventListener('click', chat_close_conf);

    chatSocket = new WebSocket(config.websocketurl + "/ws/chat/" + room.id + "/");
    chatSocket.onmessage = function(e)
    {
        const data = JSON.parse(e.data);
        console.log(data);
        if (data.type == 'announce') {
            const chat_log = document.querySelector('#chat-log')
            if (chat_log)
                chat_log.value += (data.message.author.username + ' : ' + data.content + '\n');
        }
        else if (data.type == 'chat')
		{
			const chatLog = document.querySelector('#chat-log');
			const username = data.message.author.username;
			const content = data.message.content;

			const messageElement = document.createElement('div');
			messageElement.classList.add('chat-message');
			messageElement.textContent = `${content}`;
		
			const profile_picture =  data.message.author.picture_remote ?  data.message.author.picture_remote : config.backendUrl +  data.message.author.profile_picture;


			const profileImg = document.createElement('img');
			profileImg.src = profile_picture;
			profileImg.alt = `${username}'s profile picture`; 
			profileImg.classList.add('profile-pic'); 

			const nameDiv = document.createElement('div');
			nameDiv.classList.add('nameDiv');
			nameDiv.textContent = `${username}`;
			nameDiv.innerHTML = `<span>${username}</span>`; 
			nameDiv.querySelector('span').insertAdjacentElement('afterbegin', profileImg);

			chatLog.appendChild(nameDiv);

			// Append message to chat log
			chatLog.scrollTop = chatLog.scrollHeight;
			chatLog.appendChild(messageElement);

		}
		else if (data.type == 'list-chat') {
			const chatLog = document.querySelector('#chat-log');
		
			for (const index in data.messages) {
				const message = data.messages[index];
				const username = message.author ? message.author.username : "";
				const content = message.content;

				const messageElement = document.createElement('div');
				messageElement.classList.add('chat-message');
				messageElement.textContent = `${content}`;
				
				if (message.author)
				{
					const profile_picture = message.author.picture_remote ? message.author.picture_remote : config.backendUrl + message.author.profile_picture;
					const profileImg = document.createElement('img');
					profileImg.src = profile_picture;
					profileImg.alt = `${username}'s profile picture`;
					profileImg.classList.add('profile-pic'); 

					const nameDiv = document.createElement('div');
					nameDiv.classList.add('nameDiv');
					nameDiv.textContent = `${username}`;
					nameDiv.innerHTML = `<span>${username}</span>`; // Set username
					nameDiv.querySelector('span').insertAdjacentElement('afterbegin', profileImg);
					chatLog.appendChild(nameDiv);
				}

				chatLog.scrollTop = chatLog.scrollHeight;
				chatLog.appendChild(messageElement);

			}
		}
		
        else if (data.type == 'invitation') {
			const chatLog = document.querySelector('#chat-log');
			const username = data.message && data.message.author ? data.message.author.username : 'Unknown User';
			const invitationLink = `${config.frontendUrl}/privatematchmaking?match_name=${data.match_name}`; 
	
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
        const chat_box = document.querySelector('.chat-block');
        chat_box.innerHTML = `<t1>No chat selected</t1>`;
    };
    document.querySelector('#chat-message-refresh').onclick = function(e)
    {
        chatSocket.send(JSON.stringify({
            'type': "refresh_mess",
        }));
    };
}

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
        for (const room_l of rooms)
            {
                // <div class="chat-invitations-${room_l.id}">
				
                const chat = document.createElement('li');
                chat.id = room_l.id
                let room_picture = config.backendUrl + room_l.room_picture;
				if (room_picture == "http://localhost:8000null")
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
				if (room_picture == "http://localhost:8000null")
					room_picture = "../../static/assets/jpg/default_picture.jpg"
                invite.innerHTML = `
				<li class="room">
				    <span class="room-pic"> <img src="${room_picture}" height=100 alt="Room Picture"> </span>
			        <span class="room-name-left">${room_l.name}</span>
                </li>

                `;
                invite_list.appendChild(invite);


				invite.addEventListener('click', function(event) {
						open_invitation(room_l);
				});
            };
        }
}

async function mp_somebody(user_id) {

    console.log("mp function");
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
        print_chats();
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
        router.navigate('/login');
    print_chats();
    print_invitations();
    const create_room_btn = document.querySelector('.li-create-room-btn');
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
    const container = document.querySelector('.chat_container');
    container.replaceWith(container.cloneNode(true));
}


function updateUserList(users) {
	const userList = document.querySelector('.user-list');
	userList.innerHTML = '';
	users.forEach(user => {
		const userItem = document.createElement('li');
		const profile_picture = user.picture_remote ? user.picture_remote : config.backendUrl + user.profile_picture;

		userItem.innerHTML = `
		<li class="user-search-list" >
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
    console.log(room);
    // console.log(room.participants[0]);

    const chat_box = document.querySelector('.chat-block');
	const chat_conf = document.querySelector('.chat-conf');
	const room_info = document.querySelector('.room-info');
	const room_users = document.querySelector('.room-users');

	let room_picture = config.backendUrl + room.room_picture;
	if (room_picture == "http://localhost:8000null")
	{
		room_picture = "../../static/assets/jpg/default_picture.jpg"
	}

    chat_box.innerHTML = `
	<div id=chat-header> 
		<span class="room-pic"> <img src="${room_picture}" height=100 alt="Room Picture"> </span>
		<span class="room-name">${room.name}</span>
	</div>
	<h1>Accept invite to see the content of chat</h1>
    `;

	room_info.innerHTML = `
	<div class="room-pic"> <img src="${room_picture}" height=100 alt="Room Picture"> </div>
	<div class="room-name-right"> ${room.name}  </div>
	`
	chat_conf.innerHTML = `
	<div> invited by ${room.created_by.username} </div>
	<input id="invitation-accept-${room_l.id}" type="button" value="Accept invitation">
	<input id="invitation-refuse-${room_l.id}" type="button" value="Refuse invitation">
	`;

	const btn_accept = document.getElementById(`invitation-accept-${room_l.id}`)
	const btn_refuse = document.getElementById(`invitation-refuse-${room_l.id}`)
	btn_accept.addEventListener('click', function(event) {accept_invitation(room_l.id, "TRUE")});
	btn_refuse.addEventListener('click', function(event) {accept_invitation(room_l.id, "FALSE")});

	print_member(room);
}

function print_member(room) {
	const userList = document.querySelector('.room-users');
	userList.innerHTML = '';
	room.participants.forEach(user => {
		const userItem = document.createElement('li');
		userItem.classList.add('room');

		const profile_picture = user.picture_remote ? user.picture_remote : config.backendUrl + user.profile_picture;
		if (user.username == room.created_by.username)
		{
			userItem.innerHTML = `
				<span class="room-pic"> <img src="${profile_picture}" height=100 alt="Room Picture"> </span> 
				<span class="room-name-left"> <b>${user.username}</b></span>
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
