import React, { useEffect } from 'react'
import NavBar from './components/NavBar'
import './App.css';
import { auth } from './firebase'
import  { useSelector, useDispatch } from 'react-redux'
import { setUser } from './redux/actions'
import SignUp from './components/SignUp';
import Login from './components/Login'
import GroupsList from './components/GroupsList';

function App() {
  const user = useSelector(state => state.user)
  const showSignUp = useSelector(state => state.showSignUp)
  const showLogin = useSelector(state => state.showLogin)
  const dispatch = useDispatch()

  function authStateListener() {
    auth.onAuthStateChanged(userData => {
      dispatch(setUser(userData))
    })
  }

  useEffect(() => {
    console.log(user)
  }, [user])

  useEffect(() => {
    authStateListener()
  }, [])

  return (
    <div className="App">
      <NavBar />
      { showSignUp && <SignUp /> }
      { showLogin && <Login /> }
      {
        !showSignUp && !showLogin && (
          user && !showSignUp 
          ? <GroupsList />
          : <p>inicia sesión o regístrate para empezar ;)</p>
        ) 
      }

    </div>
  );
}

export default App;
