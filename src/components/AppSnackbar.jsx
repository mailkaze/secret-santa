import { useSelector, useDispatch } from 'react-redux'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { setSnackbar } from '../redux/actions'

export default function AppSnackbar() {
  const snackbar = useSelector(state => state.snackbar)
  const dispatch = useDispatch()

  function handleClose(event, reason) {
    if (reason === 'clickaway') return
    dispatch(setSnackbar({ ...snackbar, show: false }))
  }

  // La key por aviso reinicia el temporizador aunque llegue el mismo mensaje dos veces
  return (
    <Snackbar
      key={snackbar.id}
      open={snackbar.show}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: { xs: 16 } }}
    >
      <Alert onClose={handleClose} severity={snackbar.severity} variant="filled" elevation={6} sx={{ width: '100%', maxWidth: 528 }}>
        {snackbar.message}
      </Alert>
    </Snackbar>
  )
}
