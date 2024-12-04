import { router } from "../../app.js";
import config from "../../env/config.js";
import { setCookie, getCookie, deleteCookie } from "../storage/script.js";

async function refresh_token() {
	try {
		const response = await fetch(config.backendUrl + "/refresh-token/", {
			method: "POST",
			headers:
			{
				"Content-Type": "application/json",
			},
			credentials: "include",
		});
		if (response.status == 200)
			router.connect();
		return response;
	} catch {
		return null;
	}
}

async function login(email, password) {
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

	if (response.status == 200)
		router.connect();

	return response;
}

async function login_tierce(code, user_type) {
	const response = await fetch(config.backendUrl + "/login/", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			'code': code,
			'user_type': user_type
		}),
		credentials: "include",
	});

	if (response.status == 200)
		router.connect();

	return response;
}


async function register(username, email, password, profile_picture) {
	const formData = new FormData();
	formData.append('username', username);
	formData.append('email', email);
	formData.append('password', password);
	formData.append('profile_picture', profile_picture);
	formData.append('user_type', 'email');
	const response = await fetch(config.backendUrl + "/register/", {
		method: "POST",
		body: formData,
		credentials: "include",
	});

	if (response.status === 201) {
		router.connect();
		const data = await response.json();
		setCookie('user', JSON.stringify(data.user), 5 / 1440);
		return response;
	}
	else {
		console.error('Registration failed with status:', response.status);
	}
	return response;
}

async function refresh_user() {
	const response = await fetch(config.backendUrl + "/user/",
		{
			method: "GET",
			headers:
			{
				"Content-Type": "application/json",
			},
			credentials: "include",
		}).catch(() => {
			return null
		})
	if (response.status === 200) {
		router.connect();
		const data = await response.json();
		setCookie('user', JSON.stringify(data.user), 0.003472 );
		return data.user;
	}
	return null;
}

async function get_user() {
	let user = getCookie('user');
	if (user)
		return JSON.parse(user);
	const response = await fetch(config.backendUrl + "/user/",
		{
			method: "GET",
			headers:
			{
				"Content-Type": "application/json",
			},
			credentials: "include",
		}).catch(() => {
			return null
		})
	if (response.status === 200) {
		router.connect();
		const data = await response.json();
		setCookie('user', JSON.stringify(data.user), 0.003472 );
		return data.user;
	}
	return null;
}

async function update_user(formData) {
	const response = await fetch(config.backendUrl + "/user/", {
		method: "PUT",
		body: formData,
		credentials: "include",
	});
	return response;
}

export async function update_password(formData) {
	const response = await fetch(config.backendUrl + '/user/change_password/' , {
		method: 'PUT',
		body: formData,
		credentials: 'include'
	});
	return response;
}

async function delete_user() {
	const response = await fetch(config.backendUrl + "/user/", {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
	});
	if (response.status == 200)
		router.disconnect();
	return response;
}

async function logout() {
	const response = await fetch(config.backendUrl + "/logout/", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
	});
	if (response.status == 200)
		router.disconnect();

	deleteCookie('user');
}

async function searchUsers(query, size = 30) {
	const response = await fetch(`${config.backendUrl}/user/search/?q=${query}&size=${size}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
		credentials: 'include',
	});
	return response;
}
export { login, register, get_user, update_user, delete_user, refresh_token, logout, login_tierce, searchUsers, refresh_user };
