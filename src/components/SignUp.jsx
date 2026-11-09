import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
import { auth } from '../firebase'
import { createUserProfile } from '../services'
import { notify } from '../redux/actions'
import { authErrorMessage } from '../utils'
import { authHref, navigate } from './routing'
import AuthCard from './AuthCard'

const FIELDS = [
  { id: 'name', label: 'Nombre', autoComplete: 'name', maxLength: 100, helperText: 'Así te verá el resto del grupo' },
  { id: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { id: 'password1', label: 'Contraseña', type: 'password', autoComplete: 'new-password', helperText: 'Al menos 8 caracteres' },
  { id: 'password2', label: 'Repite la contraseña', type: 'password', autoComplete: 'new-password' },
]

const EMPTY_FORM = { name: '', email: '', password1: '', password2: '' }

const PROFILE_ERROR = 'Tu cuenta se ha creado, pero no hemos podido guardar tu nombre. Pulsa «Crear cuenta» otra vez para reintentarlo.'

export default function SignUp({ returnTo }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const dispatch = useDispatch()

  function validate() {
    const { name, email, password1, password2 } = form
    if (!name.trim() || !email.trim() || !password1 || !password2) return 'Rellena todos los campos.'
    if (password1 !== password2) return 'Las contraseñas no son iguales.'
    if (password1.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
    return null
  }

  // Si la cuenta ya existe (falló la escritura del perfil), solo se reintenta el perfil
  async function getAccount(email) {
    const current = auth.currentUser
    if (current && current.email?.toLowerCase() === email.toLowerCase()) return current
    const credential = await createUserWithEmailAndPassword(auth, email, form.password1)
    return credential.user
  }

  async function onSignUp(e) {
    e.preventDefault()
    if (submitting) return
    const validationError = validate()
    if (validationError) {
      dispatch(notify('error', validationError))
      return
    }
    setSubmitting(true)
    // Si el usuario ya se ha ido a otra pantalla cuando llega la confirmación, no se le devuelve
    const startHash = window.location.hash
    try {
      let account
      try {
        account = await getAccount(form.email.trim())
      } catch (error) {
        dispatch(notify('error', authErrorMessage(error)))
        return
      }
      try {
        await createUserProfile(account.uid, form.name.trim(), account.email)
      } catch {
        dispatch(notify('error', PROFILE_ERROR))
        return
      }
      if (window.location.hash !== startHash) return
      dispatch(notify('success', `¡Te damos la bienvenida, ${form.name.trim()}!`))
      navigate(returnTo, { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard title="Crear cuenta" icon={<PersonAddAlt1Icon />}>
      <Box component="form" noValidate onSubmit={onSignUp} sx={{ mt: 1 }}>
        {FIELDS.map((field, i) => (
          <TextField
            key={field.id}
            margin="normal"
            required
            id={field.id}
            name={field.id}
            label={field.label}
            type={field.type}
            autoComplete={field.autoComplete}
            autoFocus={i === 0}
            helperText={field.helperText}
            value={form[field.id]}
            onChange={e => setForm({ ...form, [field.id]: e.target.value })}
            slotProps={{ htmlInput: { maxLength: field.maxLength } }}
          />
        ))}
        <Button type="submit" fullWidth variant="contained" size="large" disabled={submitting} sx={{ mt: 2, mb: 2 }}>
          Crear cuenta
        </Button>
        <Stack sx={{ alignItems: 'center' }}>
          <Link href={authHref('/entrar', returnTo)} variant="body2">
            ¿Ya tienes cuenta? Inicia sesión
          </Link>
        </Stack>
      </Box>
    </AuthCard>
  )
}
