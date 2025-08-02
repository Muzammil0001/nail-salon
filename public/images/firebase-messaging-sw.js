importScripts(
  "https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js"
);
firebase.initializeApp({
  apiKey: "AIzaSyBeCryV_yKphnReOhfIutrl-G7OmU7c-40",
  authDomain: "orbyfood.firebaseapp.com",
  databaseURL: "https://project-id.firebaseio.com",
  projectId: "orbyfood",
  storageBucket: "orbyfood.appspot.com",
  messagingSenderId: "188493843100",
  appId: "1:188493843100:web:87a9dbf7b6cac3d6cd7b59",
  measurementId: "G-TP41NFKJ9B",
});

const messaging = firebase.messaging();
