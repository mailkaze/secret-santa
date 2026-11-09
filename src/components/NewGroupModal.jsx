import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Modal from '@mui/material/Modal'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Icon from '@mui/material/Icon'
import { createGroup, GroupExistsError } from '../services'
import { notify } from '../redux/actions'
import { GENERIC_ERROR, validateGroupName } from '../utils'

const paperSx = {
  position: 'absolute',
  left: '5%',
  right: '5%',
  top: '30%',
  width: 'auto',
  maxWidth: '500px',
  m: 'auto',
  bgcolor: 'background.paper',
  borderRadius: '3px',
  boxShadow: 5,
  p: 2,
}

export default function NewGroupModal() {
  const [open, setOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const uid = useSelector(state => state.user?.uid)
  const dispatch = useDispatch()

  async function handleCreate(e) {
    e.preventDefault()
    const validationError = validateGroupName(groupName)
    if (validationError) {
      dispatch(notify('error', validationError))
      return
    }
    try {
      await createGroup(groupName, uid)
      dispatch(notify('success', 'Nuevo grupo creado con éxito.'))
      setGroupName('')
      setOpen(false)
    } catch (error) {
      if (error instanceof GroupExistsError) {
        dispatch(notify('error', 'Ya existe un grupo con ese nombre.'))
        setGroupName('')
      } else {
        dispatch(notify('error', GENERIC_ERROR))
      }
    }
  }

  return (
    <div>
      <Button variant="contained" color="primary" startIcon={<Icon>add</Icon>} onClick={() => setOpen(true)}>
        Crear grupo
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} aria-labelledby="new-group-name">
        <Box sx={paperSx}>
          <form autoComplete="off" style={{ margin: 'auto' }} onSubmit={handleCreate}>
            <TextField
              variant="standard"
              id="new-group-name"
              label="Nombre del grupo"
              sx={{ display: 'block', mb: '8px', width: '90%' }}
              onChange={e => setGroupName(e.target.value)}
              value={groupName}
              required
              autoFocus
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />
            <Button type="submit" variant="contained" color="primary" style={{ margin: 'auto' }}>
              Crear Grupo
            </Button>
          </form>
        </Box>
      </Modal>
    </div>
  )
}
