import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { auth } from '../firebase'
import { notify } from '../redux/actions'
import { authErrorMessage } from '../utils'
import { authHref } from './routing'
import AuthCard from './AuthCard'

// Al entrar, App vuelve a returnTo; si se muestra en la ruta de un grupo, ese grupo se abre solo
export default function Login({ returnTo, notice }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [recovering, setRecovering] = useState(false)
  const dispatch = useDispatch()

  async function onSubmit(e) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch (error) {
      dispatch(notify('error', authErrorMessage(error)))
    } finally {
      setSubmitting(false)
    }
  }

  async function recoverPassword() {
    if (email.trim() === '') {
      dispatch(notify('warning', 'Escribe tu email arriba y vuelve a pulsar aquí para recibir el correo de recuperación.'))
      return
    }
    setRecovering(true)
    try {
      await sendPasswordResetEmail(auth, email.trim())
      dispatch(notify('success', 'Te hemos enviado un correo para cambiar tu contraseña. Revisa tu bandeja de entrada.'))
    } catch {
      dispatch(notify('error', 'No se ha podido enviar el correo de recuperación. Revisa el email que has escrito y tu conexión.'))
    } finally {
      setRecovering(false)
    }
  }

  return (
    <AuthCard title="Iniciar sesión" icon={<LockOutlinedIcon />}>
      {notice && <Alert severity="info" sx={{ mt: 2 }}>{notice}</Alert>}
      <Box component="form" noValidate onSubmit={onSubmit} sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          required
          id="email"
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <TextField
          margin="normal"
          required
          name="password"
          label="Contraseña"
          type="password"
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <Button type="submit" fullWidth variant="contained" size="large" disabled={submitting} sx={{ mt: 2, mb: 2 }}>
          Iniciar sesión
        </Button>
        <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
          <Link component="button" type="button" variant="body2" onClick={recoverPassword} disabled={recovering}>
            ¿Has olvidado tu contraseña?
          </Link>
          <Link href={authHref('/registro', returnTo)} variant="body2">
            ¿No tienes cuenta? Regístrate
          </Link>
        </Stack>
      </Box>
    </AuthCard>
  )
}
