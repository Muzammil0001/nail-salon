importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
	apiKey: 'AIzaSyBeCryV_yKphnReOhfIutrl-G7OmU7c-40',
	authDomain: 'orbyfood.firebaseapp.com',
	databaseURL: 'https://project-id.firebaseio.com',
	projectId: "orbyfood",
	storageBucket: "orbyfood.appspot.com",
	messagingSenderId: "188493843100",
	appId: "1:188493843100:web:87a9dbf7b6cac3d6cd7b59",
	measurementId: "G-TP41NFKJ9B"
});



// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

/*
messaging.onBackgroundMessage(function(payload) {
	console.log(' Received background message ', payload);
	// Customize notification here
	const notificationTitle = 'Background Message Title';
	const notificationOptions = {
		body: 'Background Message body.',
		icon: '/firebase-logo.png'
	};

	self.registration.showNotification(notificationTitle,
		notificationOptions);
});
*/
