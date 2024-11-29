import { get_user } from "../../components/user/script.js";
import { router } from '../../app.js';
import config from '../../env/config.js';
import {customalert} from '../../components/alert/script.js';

async function add_user_friend(user_id) {
    const response = await fetch(config.backendUrl + "/user/friend/" + user_id + "/", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: "include",
    });
    const data = await response.json();
    if (response.status === 200)
            return data.message;
    else {
        console.log("error: ", data['error'])
    }
    return null;
}

async function delete_user_friend(user_id) {
    const response = await fetch(config.backendUrl + "/user/friend/" + user_id + "/", {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: "include",
    });
    const data = await response.json();
    if (response.status === 200)
            return data.message;
    else {
        console.log("error: ", data['error'])
    }
    return null;
}

async function get_user_friends(user_id) {
    const response = await fetch(config.backendUrl + "/user/friend/" + user_id + "/", {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: "include",
    });
    const data = await response.json();
    if (response.status === 200) {
		return data.friends;
	}
    else {
        console.log("error: ", data['error'])
    }
    return null;
}

async function displayFriends(user_id) {
	const friends = await get_user_friends(user_id);

	console.log(friends);

	if (friends && friends.length > 0) {
		let friendsList = document.querySelector("#list");
		friendsList.innerHTML = ""; // Efface le contenu existant
	
		friends.forEach(friend => {
				let friendElement = document.createElement("div");
				friendElement.className = "friend";

				let pictureDiv = document.createElement("div");
				pictureDiv.className = "profile-picture-container";
				
				let usernameDiv = document.createElement("div");
				usernameDiv.className = "username";

				const profilePicture =  friend.picture_remote ?  friend.picture_remote : config.backendUrl +  friend.profile_picture;

				const profileImage = document.createElement("img");
				profileImage.src = profilePicture;
				profileImage.alt = `friend.username's profile picture`; 
				// profileImage.classList.add('');

				pictureDiv.appendChild(profileImage);
				friendElement.appendChild(pictureDiv);

				let usernameSpan = document.createElement("span");
				usernameSpan.className = "text";
				usernameSpan.textContent = friend.username;

				usernameDiv.appendChild(usernameSpan);

				let deleteButton = document.createElement("button");
				deleteButton.className = "delete-friend";
				deleteButton.textContent = "Delete";
				//red cross

				deleteButton.addEventListener("click", () => {
					console.log(`Deleting friend: ${friend.username}`);
				});
				friendElement.appendChild(usernameDiv);
				friendElement.appendChild(deleteButton);
				friendsList.appendChild(friendElement);
		});
	}

	else {
		customalert("Error", "No friends :(");
	}
}

export async function initComponent(params) {	
    let user = await get_user();
    if (!user)
        router.navigate('/');
	console.log()
	displayFriends(user.id);
}

export async function cleanupComponent(params) {

}