import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { createUserWithEmailAndPassword } from 'firebase/auth'
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
import { createUserProfile } from '../services'
import { setShowSignUp, setShowLogin, notify } from '../redux/actions'
import { authErrorMessage, GENERIC_ERROR } from '../utils'

const FIELDS = [
  { id: 'name', label: 'Nombre', autoComplete: 'name', maxLength: 100 },
  { id: 'email', label: 'Email', autoComplete: 'email' },
  { id: 'password1', label: 'Contraseña', type: 'password', autoComplete: 'new-password' },
  { id: 'password2', label: 'Repite la contraseña', type: 'password', autoComplete: 'new-password' },
]

const EMPTY_FORM = { name: '', email: '', password1: '', password2: '' }

export default function SignUp() {
  const [form, setForm] = useState(EMPTY_FORM)
  const dispatch = useDispatch()

  function validate() {
    const { name, email, password1, password2 } = form
    if (!name.trim() || !email.trim() || !password1 || !password2) return 'Debe llenar todos los datos.'
    if (password1 !== password2) return 'Las contraseñas no son iguales.'
    if (password1.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
    return null
  }

  async function onSignUp(e) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      dispatch(notify('error', validationError))
      return
    }
    let credential
    try {
      credential = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password1)
    } catch (error) {
      dispatch(notify('error', authErrorMessage(error)))
      return
    }
    try {
      await createUserProfile(credential.user.uid, form.name.trim(), credential.user.email)
      setForm(EMPTY_FORM)
      dispatch(setShowSignUp(false))
    } catch {
      dispatch(notify('error', GENERIC_ERROR))
    }
  }

  function goToLogin() {
    dispatch(setShowSignUp(false))
    dispatch(setShowLogin(true))
  }

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Regístrate
        </Typography>
        <Box component="form" noValidate onSubmit={onSignUp} sx={{ width: '100%', mt: 3 }}>
          <Grid container spacing={2}>
            {FIELDS.map((field, i) => (
              <Grid size={12} key={field.id}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  id={field.id}
                  name={field.id}
                  label={field.label}
                  type={field.type}
                  autoComplete={field.autoComplete}
                  autoFocus={i === 0}
                  value={form[field.id]}
                  onChange={e => setForm({ ...form, [field.id]: e.target.value })}
                  slotProps={{ htmlInput: { maxLength: field.maxLength } }}
                />
              </Grid>
            ))}
          </Grid>
          <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 3, mb: 2 }}>
            Regístrate
          </Button>
          <Grid container sx={{ justifyContent: 'flex-end' }}>
            <Grid>
              <Link component="button" type="button" variant="body2" onClick={goToLogin}>
                ¿Ya estás registrado? Inicia sesión
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  )
}
