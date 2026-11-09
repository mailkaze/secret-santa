import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import AddIcon from '@mui/icons-material/Add'
import { createGroup, GroupExistsError } from '../services'
import { notify } from '../redux/actions'
import { GENERIC_ERROR, validateGroupName } from '../utils'
import { groupPath, navigate } from './routing'

export default function NewGroupModal() {
  const [open, setOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const uid = useSelector(state => state.user?.uid)
  const dispatch = useDispatch()

  function close() {
    if (!submitting) setOpen(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (submitting) return
    const validationError = validateGroupName(groupName)
    if (validationError) {
      dispatch(notify('error', validationError))
      return
    }
    setSubmitting(true)
    try {
      const groupId = await createGroup(groupName, uid)
      dispatch(notify('success', 'Grupo creado. Invita a tu gente con el botón «Invitar».'))
      setGroupName('')
      setOpen(false)
      navigate(groupPath(groupId))
    } catch (error) {
      if (error instanceof GroupExistsError) {
        dispatch(notify('error', 'Ya existe un grupo con ese nombre.'))
      } else {
        dispatch(notify('error', GENERIC_ERROR))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)} sx={{ flexShrink: 0 }}>
        Crear grupo
      </Button>
      <Dialog open={open} onClose={close} aria-labelledby="new-group-title" fullWidth maxWidth="xs">
        <form noValidate autoComplete="off" onSubmit={handleCreate}>
          <DialogTitle id="new-group-title" sx={{ fontWeight: 800 }}>Nuevo grupo</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Ponle un nombre que tu gente reconozca, como «Familia García» o «Amigos del trabajo».
            </DialogContentText>
            <TextField
              id="new-group-name"
              label="Nombre del grupo"
              margin="normal"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              required
              autoFocus
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={close} color="secondary">Cancelar</Button>
            <Button type="submit" variant="contained" disabled={submitting}>Crear</Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  )
}
