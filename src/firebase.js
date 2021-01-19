import firebase from 'firebase';
import 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDJCK3R1PdzdQUPWp4PhcZbqHO1CGWWkHA",
  authDomain: "chatroom-445b9.firebaseapp.com",
  projectId: "chatroom-445b9",
  storageBucket: "chatroom-445b9.appspot.com",
  messagingSenderId: "606970255390",
  appId: "1:606970255390:web:c40bacf0fadc643ece760f",
  measurementId: "G-DHN4VKBMML"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export const db = firebase.firestore();
