import React, { useEffect } from 'react'
import NavBar from './components/NavBar'
import './App.css';
import { auth, db } from './firebase'
import { useSelector, useDispatch } from 'react-redux'
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
    auth.onAuthStateChanged(userCredential => {
      if (userCredential) {
        db.collection('users').doc(userCredential.uid).get()
        .then(doc => {
          dispatch(setUser({...doc.data(), uid: doc.id}))
          console.log('USER:', doc.data().name)
        })
      } else {
        console.log('No hay usuario')
        // reseteamos todo el state incluido el user a null:
        dispatch(resetState())
      }
    })
  }

  useEffect(() => {
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
