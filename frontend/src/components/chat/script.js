import config from "../../env/config.js";

export async function get_user_chats()
{
	const response = await fetch(config.backendUrl + "/user/chats/", {
		method: "GET",
		credentials: "include",
	});
    if (response.status === 200)
    {
        const data = await response.json();
        console.log(data)
        return data
    }
	return null;
}