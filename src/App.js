import React, { useEffect } from 'react'
import NavBar from './components/NavBar'
import './App.css';
import { auth, db } from './firebase'
import  { useSelector, useDispatch } from 'react-redux'
import { setUser, resetState } from './redux/actions'
import SignUp from './components/SignUp';
import Login from './components/Login'
import GroupsList from './components/GroupsList';
import Dashboard from './components/Dashboard'

function App() {
  const user = useSelector(state => state.user)
  const showSignUp = useSelector(state => state.showSignUp)
  const showLogin = useSelector(state => state.showLogin)
  const showDashboard = useSelector(state => state.showDashboard)
  const dispatch = useDispatch()

  function authStateListener() {
    auth.onAuthStateChanged(userData => {
      if (userData) {
        // ESTO NO DEBERIA SER ONSNAPSHOT, CUANDO TOQUE ALGO DEL USUARIO, DEBERIA ACTUALIZAR EL STATE DE USER ALLI.???
        db.collection('users').doc(userData.uid).onSnapshot(doc => {
          dispatch(setUser({...doc.data(), uid: doc.id}))
          console.log('User:', {...doc.data(), uid: doc.id})
          alert(`usuario cambiado a: ${doc.data().name}`)
        })
      } else {
        console.log('No hay usuario')
        // dispatch(setUser(null))
        // reseteamos todo el state incluido el user a null:
        dispatch(resetState())
      }
    })
  }

  useEffect(() => {
    console.log('se recarga app.js')
    authStateListener()
  }, [])

  return (
    <div className="App">
      <NavBar />
      { showSignUp && <SignUp /> }
      { showLogin && <Login /> }
      { // Si no se muestran ni signup ni login...
        !showSignUp && !showLogin && (
          user // ...y el usuario está logueado...
          ? ( // ...mostramos el dashboard de un grupo si ha sido llamado...
              showDashboard
              ? <Dashboard />
              : <GroupsList /> // ...y si no, mostramos la lista de grupos...
            )// ...si no hay usuario mostramos la pantalla de bienvenida.
          : <p>inicia sesión o regístrate para empezar ;)</p>
        ) 
      }

    </div>
  );
}

export default App;
