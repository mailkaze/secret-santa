import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyAm5io0RaO3GRWKC0ffSOkZukFoz6unolg",
  authDomain: "secret-santa-5c0d3.firebaseapp.com",
  databaseURL: "https://secret-santa-5c0d3.firebaseio.com",
  projectId: "secret-santa-5c0d3",
  storageBucket: "secret-santa-5c0d3.appspot.com",
  messagingSenderId: "401070720564",
  appId: "1:401070720564:web:c050970173cb0abeac6c61"
};
// Initialize Firebase
const fb =  firebase.initializeApp(firebaseConfig)
export const db = fb.firestore()
export const auth = fb.auth()