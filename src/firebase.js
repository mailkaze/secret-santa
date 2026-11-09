import { initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'
import { getFirestore } from 'firebase/firestore'
import {
  browserLocalPersistence,
  browserSessionPersistence,
  indexedDBLocalPersistence,
  initializeAuth,
} from 'firebase/auth'

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

// App Check es opcional: solo se activa si el build tiene la clave de reCAPTCHA Enterprise
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY
if (recaptchaSiteKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
    isTokenAutoRefreshEnabled: true,
  })
}

export const db = getFirestore(app)
// Solo email y contraseña: sin el resolutor de popup/redirect no se cargan el iframe de authDomain
// ni apis.google.com, y la CSP de firebase.json no necesita permitirlos.
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
})
