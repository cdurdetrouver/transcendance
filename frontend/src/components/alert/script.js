let display = false;
let timeoutid = null;

function customalert(title, description, error = false) {
	if (display) {
		console.log('Alert already displayed');
		return;
	}

	const alertDiv = document.getElementsByClassName('alert')[0];

	if (error) {
		alertDiv.classList.add('error');
	} else {
		alertDiv.classList.add('success');
	}
	display = true;
	alertDiv.getElementsByClassName('alert__title')[0].innerText = title;
	alertDiv.getElementsByClassName('alert__description')[0].innerText = description;

	timeoutid = setTimeout(() => {
		alertDiv.classList.remove('error');
		alertDiv.classList.remove('success');
		display = false;
	}, 4000); 
}

function clearalert() {
	if (display == false)
		return (false);
	clearTimeout(timeoutid);
	const alertDiv = document.getElementsByClassName('alert')[0];
	alertDiv.classList.remove('error');
	alertDiv.classList.remove('success');
	display = false;
	return (true);
}

export { customalert, clearalert };