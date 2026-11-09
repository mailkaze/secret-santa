import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// La configuración web de Firebase es pública por diseño; la seguridad la dan firestore.rules
const firebaseConfig = {
  apiKey: 'AIzaSyAm5io0RaO3GRWKC0ffSOkZukFoz6unolg',
  authDomain: 'secret-santa-5c0d3.firebaseapp.com',
  databaseURL: 'https://secret-santa-5c0d3.firebaseio.com',
  projectId: 'secret-santa-5c0d3',
  storageBucket: 'secret-santa-5c0d3.appspot.com',
  messagingSenderId: '401070720564',
  appId: '1:401070720564:web:c050970173cb0abeac6c61',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
