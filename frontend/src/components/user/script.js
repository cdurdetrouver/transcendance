import config from "../../env/config.js";
import { setCookie, getCookie, deleteCookie } from "../storage/script.js";

async function refresh_token()
{
	const response = await fetch(config.backendUrl + "/refresh-token/", {
		method: "POST",
		headers:
		{
			"Content-Type": "application/json",
		},
		credentials: "include",
	});
	return response;
}

async function login(email, password)
{
	const response = await fetch(config.backendUrl + "/login/", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			'email': email,
			'password': password,
			'user_type': 'email'
		}),
		credentials: "include",
	});

	if (response.status === 200)
	{
		const data = await response.json();

		setCookie('user', JSON.stringify(data.user), 5 / 1440);
	}
	return response;
}

async function register(username, email, password)
{
	const response = await fetch(config.backendUrl + "/register/", {
		method: "POST",
		headers:
		{
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			'username': username,
			'email': email,
			'password': password,
			'user_type': 'email'
		}),
		credentials: "include",
	});

	if (response.status === 201)
	{
		const data = await response.json();

		setCookie('user', JSON.stringify(data.user), 5 / 1440);
	}
	return response;
}

async function get_user()
{
	let user = getCookie('user');
	if (user)
		return JSON.parse(user);
	let refresh = await refresh_token();
	if (refresh.status !== 200)
		return null;
	const response = await fetch(config.backendUrl + "/user/",
	{
		method: "GET",
		headers:
		{
			"Content-Type": "application/json",
		},
		credentials: "include",
	});
	if (response.status === 200)
	{
		const data = await response.json();

		setCookie('user', JSON.stringify(data.user), 5 / 1440);

		return data.user;
	}
	return null;
}

async function get_score()
{
	deleteCookie("user");
	const user = await get_user();
	console.log(user);
	if (user)
	{
		const bestScore = user.best_score;
		return bestScore;
	}
	return null;
}


async function logout()
{
	await fetch(config.backendUrl + "/logout/", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
	});

	deleteCookie('user');
}

async function update_score(bestScore) {
	let user = getCookie('user');
	if (!user)
	{
		let refresh = await refresh_token();
		if (refresh.status !== 200)
			return null;
	}

    const response = await fetch(config.backendUrl + "/user/update/", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            'best_score': bestScore,
        }),
        credentials: "include",
    });

    if (response.status === 200) {
        const data = await response.json();
        console.log(data.message);
    } else {
        console.error('Failed to update score');
    }
	return response;
}



export { login, register, get_user, refresh_token, logout, get_score, update_score};
