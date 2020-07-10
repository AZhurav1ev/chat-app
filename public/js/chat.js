const socket = io();

// Elements 
const $messageForm = document.querySelector('#form');
const $messafeFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messageContainer = document.querySelector('#message-container');
const $sidebar = document.querySelector('#sidebar');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const linkTemplate = document.querySelector('#link-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Queries
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
	const $newMessage = $messageContainer.lastElementChild;

	const newmessageContainerStyles = getComputedStyle($newMessage);
	const newMessageMargin = parseInt(newmessageContainerStyles.marginBottom);
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

	const visibleHeight = $messageContainer.offsetHeight;

	const containerHeight = $messageContainer.scrollHeight;

	const scrollOffset = $messageContainer.scrollTop + visibleHeight;

	if (containerHeight - newMessageHeight <= scrollOffset) {
		$messageContainer.scrollTop = $messageContainer.scrollHeight;
	}
}

socket.on('message', (message) => {
	const html = Mustache.render(messageTemplate, {
		username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format('h:mm a')
	});

	$messageContainer.insertAdjacentHTML('beforeend', html);
	autoscroll();
});

socket.on('locationMessage', (url) => {
	const html = Mustache.render(linkTemplate, {
		username: url.username,
		url: url.url,
		createdAt: moment(url.createdAt).format('h:mm a')
	})

	$messageContainer.insertAdjacentHTML('beforeend', html);
	autoscroll();
});

socket.on('roomData', ({ room, users }) => {
	const html = Mustache.render(sidebarTemplate, {
		room,
		users
	});
	$sidebar.innerHTML = html;
});

$messageForm.addEventListener('submit', (event) => {
	event.preventDefault();

	$messageFormButton.setAttribute('disabled', 'disabled');

	const message = $messafeFormInput.value;

	socket.emit('sendMessage', message, (error) => {
		$messageFormButton.removeAttribute('disabled');
		$messafeFormInput.value = '';
		$messafeFormInput.focus();

		if (error) {
			return console.log(error);
		}

		console.log('The message was delivered');
	});
});

$sendLocationButton.addEventListener('click', () => {
	if (!navigator.geolocation) {
		return alert('Geolocation is not supported by your browser');
	}

	$sendLocationButton.setAttribute('disabled', 'disabled');

	navigator.geolocation.getCurrentPosition((position) => {
		let { latitude, longitude } = position.coords;
		socket.emit('sendLocation', { latitude, longitude }, () => {
			$sendLocationButton.removeAttribute('disabled');
			console.log('Location shared');
		});
	});
});

socket.emit('join', { username, room }, (error) => {
	if (error) {
		alert(error);
		location.href = '/'
	}
});
