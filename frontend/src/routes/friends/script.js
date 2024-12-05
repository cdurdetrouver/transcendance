import { get_user } from "../../components/user/script.js";
import { router } from '../../app.js';
import config from '../../env/config.js';
import {customalert} from '../../components/alert/script.js';

async function deleteUserFriend(user) {
    const response = await fetch(config.backendUrl + "/user/friend/" + user.id + "/", {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: "include",
    });
    const data = await response.json();
    if (response.status === 200) {
        customalert("Success", user.username + " is no longer your friend");
        return data.message;
    }
    else {
        console.log("error: ", data['error'])
    }
    return null;
}

async function getUserFriends(user) {

    const response = await fetch(config.backendUrl + "/user/friend/" + user.id + "/", {
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
        // console.log("error: ", data['error'])
    }
    return null;
}

async function displayFriends(user) {
	const friends = await getUserFriends(user);

	if (friends && friends.length > 0) {
		let friendsList = document.querySelector("#list");
		friendsList.innerHTML = ""; // Efface le contenu existant
	
		friends.forEach(friend => {
            
				let friendElement = document.createElement("div");
				friendElement.className = "friend";

				
				let usernameDiv = document.createElement("div");
				usernameDiv.className = "username";
				
                let pictureDiv = document.createElement("div");
				pictureDiv.className = "profile-picture-container";
                
				const profilePicture =  friend.picture_remote ?  friend.picture_remote : config.backendUrl +  friend.profile_picture;

				const profileImage = document.createElement("img");
				profileImage.src = profilePicture;
				profileImage.alt = `friend.username's profile picture`;
				// profileImage.classList.add('');

				pictureDiv.appendChild(profileImage);

                let onlineStatus = document.createElement("div");
                onlineStatus.className = "online-status";

                console.log("friend.online = ", friend.online);
                // friend.online = true;
                if (!friend.online)
                    onlineStatus.style.background = "linear-gradient(145deg, #b4b4b4, #666666)";

				friendElement.appendChild(pictureDiv);
                pictureDiv.appendChild(onlineStatus);


				let usernameSpan = document.createElement("span");
				usernameSpan.className = "text";
				usernameSpan.textContent = friend.username;

				usernameDiv.appendChild(usernameSpan);

				let deleteButton = document.createElement("button");
				deleteButton.className = "delete-friend";
				// deleteButton.textContent = "Delete";
                let deleteImage = document.createElement("img");
                deleteImage.src = "../../static/assets/no.png";
                deleteImage.alt = "delete";


                deleteButton.appendChild(deleteImage);
                friendElement.appendChild(usernameDiv);
                friendElement.appendChild(deleteButton);
                friendsList.appendChild(friendElement);

                const yesButton = document.querySelector("#yes");
                const noButton = document.querySelector("#no");
                const popin = document.querySelector("#popin");

                deleteButton.addEventListener("click", () => {
                    popin.style.display = "flex";
        
                    yesButton.addEventListener("click", function() {
                        const friendElement = deleteButton.closest('.friend');
                        console.log(("friend id = ", friend.id));
                        deleteUserFriend(friend);
                        friendElement.remove();
                        popin.style.display = "none";
                    });
        
                    noButton.addEventListener("click", function() {
                        popin.style.display = "none";
                    });
                });

                friendElement.addEventListener("click", () => {
                    router.navigate(`/account?id=${friend.id}`);
                });
		});
	}
	else {
		// customalert("Error", "No friends :(");
	}
}

export async function initComponent(params) {	
    let user = await get_user();
    if (!user) {
        customalert('Error', 'You are not logged in', true);
        router.navigate('/');

    }
	displayFriends(user);
    document.querySelector("#header button").addEventListener("click", () => {
        window.location.href = "/friends";
    });
}

export async function cleanupComponent(params) {

}