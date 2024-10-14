import config from "../../env/config.js";
import { setCookie, getCookie, deleteCookie } from "../storage/script.js";

async function refresh_token() {
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
		const data = await response.json();

		setCookie('user', JSON.stringify(data.user), 5 / 1440);
		return response;
	}
	return response;
}

async function get_user() {
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
	if (response.status === 200) {
		const data = await response.json();

		setCookie('user', JSON.stringify(data.user), 5 / 1440);

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

async function delete_user() {
	const response = await fetch(config.backendUrl + "/user/", {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
	});
	return response;
}

async function logout() {
	await fetch(config.backendUrl + "/logout/", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
	});

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

export { login, register, get_user, update_user, delete_user, refresh_token, logout, login_tierce, searchUsers };
