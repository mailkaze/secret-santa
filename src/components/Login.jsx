import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import CssBaseline from '@mui/material/CssBaseline'
import TextField from '@mui/material/TextField'
import Link from '@mui/material/Link'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { auth } from '../firebase'
import { setShowLogin, setShowSignUp, notify } from '../redux/actions'
import { authErrorMessage } from '../utils'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const dispatch = useDispatch()

  async function onSubmit(e) {
    e.preventDefault()
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      dispatch(setShowLogin(false))
    } catch (error) {
      dispatch(notify('error', authErrorMessage(error)))
    }
  }

  function goToSignUp() {
    dispatch(setShowLogin(false))
    dispatch(setShowSignUp(true))
  }

  async function recoverPassword() {
    if (email.trim() === '') {
      dispatch(notify('warning', 'Escribe tu correo electrónico en el campo correspondiente para que podamos enviarte el correo de recuperación.'))
      return
    }
    try {
      await sendPasswordResetEmail(auth, email.trim())
      dispatch(notify('success', 'Se ha enviado un correo con instrucciones para recuperar tu contraseña, revisa tu email.'))
    } catch {
      dispatch(notify('error', 'No se pudo enviar el correo de recuperación, revisa la dirección email que has escrito y tu conexión a internet.'))
    }
  }

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Iniciar sesión
        </Typography>
        <Box component="form" noValidate onSubmit={onSubmit} sx={{ width: '100%', mt: 1 }}>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Contraseña"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 3, mb: 2 }}>
            Iniciar sesión
          </Button>
          <Grid container>
            <Grid size="grow" sx={{ textAlign: 'left' }}>
              <Link component="button" type="button" variant="body2" onClick={recoverPassword}>
                ¿Olvidaste tu contraseña?
              </Link>
            </Grid>
            <Grid>
              <Link component="button" type="button" variant="body2" onClick={goToSignUp}>
                ¿No tienes una cuenta? Regístrate
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  )
}
