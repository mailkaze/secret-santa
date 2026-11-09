import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import { subscribeToUser, subscribeToUserGroups } from './services'
import { setUser, updateUser, setUserGroups, setUserRequests, resetState } from './redux/actions'
import NavBar from './components/NavBar'
import SignUp from './components/SignUp'
import Login from './components/Login'
import GroupsList from './components/GroupsList'
import Dashboard from './components/Dashboard'
import Welcome from './components/Welcome'
import AppSnackbar from './components/AppSnackbar'

export default function App() {
  const uid = useSelector(state => state.user?.uid)
  const showSignUp = useSelector(state => state.showSignUp)
  const showLogin = useSelector(state => state.showLogin)
  const showDashboard = useSelector(state => state.showDashboard)
  const dispatch = useDispatch()

  useEffect(() => onAuthStateChanged(auth, authUser => {
    if (authUser) {
      dispatch(setUser({ uid: authUser.uid, email: authUser.email, name: '' }))
    } else {
      dispatch(resetState())
    }
  }), [dispatch])

  // Escuchas en tiempo real del perfil y de los grupos; se cancelan al cerrar sesión
  useEffect(() => {
    if (!uid) return
    const unsubscribers = [
      subscribeToUser(uid, profile => dispatch(updateUser(profile))),
      subscribeToUserGroups(uid, 'users', groups => dispatch(setUserGroups(groups))),
      subscribeToUserGroups(uid, 'requests', groups => dispatch(setUserRequests(groups))),
    ]
    return () => unsubscribers.forEach(unsubscribe => unsubscribe())
  }, [uid, dispatch])

  function renderContent() {
    if (showSignUp) return <SignUp />
    if (showLogin) return <Login />
    if (!uid) return <Welcome />
    return showDashboard ? <Dashboard /> : <GroupsList />
  }

  return (
    <div className="App">
      <NavBar />
      {renderContent()}
      <AppSnackbar />
    </div>
  )
}
