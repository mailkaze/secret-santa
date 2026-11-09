import { useSelector, useDispatch } from 'react-redux'
import { signOut } from 'firebase/auth'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import LogoutIcon from '@mui/icons-material/Logout'
import { auth } from '../firebase'
import { notify } from '../redux/actions'
import { GENERIC_ERROR } from '../utils'
import { navigate } from './routing'

// En pantallas muy estrechas el botón pierde el icono para que quepa junto al nombre
const barButtonSx = {
  flexShrink: 0,
  whiteSpace: 'nowrap',
  px: { xs: 1.5, sm: 2.5 },
  '& .MuiButton-startIcon': { display: { xs: 'none', sm: 'inherit' } },
}

export default function NavBar() {
  const isLoggedIn = useSelector(state => state.user !== null)
  const dispatch = useDispatch()

  async function logout() {
    // Primero se va al inicio para no enseñar la pantalla de acceso del grupo que estaba abierto
    navigate('/')
    try {
      await signOut(auth)
    } catch {
      dispatch(notify('error', GENERIC_ERROR))
    }
  }

  return (
    <AppBar position="sticky" color="primary" elevation={0}>
      <Toolbar disableGutters sx={{ width: '100%', maxWidth: 560, mx: 'auto', px: 2, gap: 1 }}>
        <Box
          component="a"
          href="#/"
          sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: 'inherit', textDecoration: 'none', flexGrow: 1, minWidth: 0, minHeight: 44 }}
        >
          <Box sx={{ display: 'grid', placeItems: 'center', width: 38, height: 38, borderRadius: '50%', bgcolor: '#ffffff', flexShrink: 0 }}>
            <Box component="img" src="/sombrero-de-santa.svg" alt="" sx={{ height: 26 }} />
          </Box>
          <Typography component="span" variant="h6" noWrap sx={{ fontWeight: 800, letterSpacing: '0.01em', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            Secret Santa
          </Typography>
        </Box>
        {isLoggedIn
          ? <Button color="inherit" startIcon={<LogoutIcon />} onClick={logout} sx={barButtonSx}>Cerrar sesión</Button>
          : <Button color="inherit" href="#/entrar" sx={barButtonSx}>Iniciar sesión</Button>}
      </Toolbar>
    </AppBar>
  )
}
