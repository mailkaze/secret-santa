import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { onAuthStateChanged } from 'firebase/auth'
import Box from '@mui/material/Box'
import { auth } from './firebase'
import { subscribeToUser, subscribeToUserGroups } from './services'
import { setUser, updateUser, setUserGroups, setUserRequests, resetState } from './redux/actions'
import { navigate, useRoute } from './components/routing'
import NavBar from './components/NavBar'
import Splash from './components/Splash'
import SignUp from './components/SignUp'
import Login from './components/Login'
import GroupsList from './components/GroupsList'
import Dashboard from './components/Dashboard'
import Welcome from './components/Welcome'
import AppSnackbar from './components/AppSnackbar'

export default function App() {
  const uid = useSelector(state => state.user?.uid)
  const hasProfile = useSelector(state => Boolean(state.user?.name))
  const [authReady, setAuthReady] = useState(false)
  const route = useRoute()
  const dispatch = useDispatch()

  useEffect(() => onAuthStateChanged(auth, authUser => {
    if (authUser) {
      dispatch(setUser({ uid: authUser.uid, email: authUser.email, name: '' }))
    } else {
      dispatch(resetState())
    }
    setAuthReady(true)
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

  // Con la sesión iniciada no se muestra el formulario de entrada; el de registro se mantiene
  // hasta que el perfil existe para poder reintentar su escritura
  const leaveAuthScreen = Boolean(uid) && (route.name === 'login' || (route.name === 'signup' && hasProfile))
  useEffect(() => {
    if (leaveAuthScreen) navigate(route.returnTo, { replace: true })
  }, [leaveAuthScreen, route])

  function renderContent() {
    if (!authReady || leaveAuthScreen) return <Splash />
    switch (route.name) {
      case 'login':
        return <Login returnTo={route.returnTo} />
      case 'signup':
        return <SignUp returnTo={route.returnTo} />
      case 'group':
        return uid
          ? <Dashboard key={route.groupId} groupId={route.groupId} />
          : <Login returnTo={route.path} notice="Inicia sesión para ver este grupo." />
      default:
        return uid ? <GroupsList /> : <Welcome />
    }
  }

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <NavBar />
      <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {renderContent()}
      </Box>
      <AppSnackbar />
    </Box>
  )
}
