import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { notify } from '../redux/actions'
import { saveWish, subscribeToWish } from '../services'
import { DEFAULT_WISH, GENERIC_ERROR } from '../utils'
import SectionCard from './SectionCard'

// El deseo por defecto se muestra como sugerencia; si el campo se deja vacío se guarda ese texto
export default function WishCard({ groupId, uid }) {
  const [wish, setWish] = useState('')
  const [saving, setSaving] = useState(false)
  const dispatch = useDispatch()

  useEffect(() => subscribeToWish(groupId, uid, text => setWish(text === DEFAULT_WISH ? '' : text)), [groupId, uid])

  async function save(e) {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      await saveWish(groupId, uid, wish.trim() || DEFAULT_WISH)
      dispatch(notify('success', 'Tu deseo se ha guardado.'))
    } catch {
      dispatch(notify('error', GENERIC_ERROR))
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard id="wish-title" title="Tu deseo">
      <Box component="form" onSubmit={save}>
        <TextField
          id="wish"
          label="¿Qué te gustaría que te regalaran?"
          placeholder={DEFAULT_WISH}
          helperText="Quien te regale verá este texto"
          multiline
          minRows={2}
          maxRows={8}
          value={wish}
          onChange={e => setWish(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 500 }, inputLabel: { shrink: true } }}
        />
        <Button type="submit" variant="contained" disabled={saving} sx={{ mt: 1.5 }}>Guardar deseo</Button>
      </Box>
    </SectionCard>
  )
}
