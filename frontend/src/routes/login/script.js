function getLocalStore(key) {
	return localStorage.getItem(key);
}

function setLocalStore(key, value) {
	localStorage.setItem(key, value);
}

$('.toggle').click(function(){
	$(this).children('i').toggleClass('fa-pencil');
	$('.form').animate({
		height: "toggle",
		'padding-top': 'toggle',
		'padding-bottom': 'toggle',
		opacity: "toggle"
	}, "slow");
});

function login() {
	var username = $('#username').val();
	var password = $('#password').val();
	$.ajax({
		url: 'http://localhost:8000/api/login',
		type: 'POST',
		data: {
			username: username,
			password: password
		},
		success: function(data) {
			if (data.status === 200) {
				setLocalStore('token', data.token);
				setLocalStore('username', username);
				window.location.href = '/home';
			} else {
				alert(data.message);
			}
		},
		error: function(err) {
			console.log(err);
		}
	});
}
