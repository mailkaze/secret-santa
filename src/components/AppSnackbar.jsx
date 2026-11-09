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

  return (
    <Snackbar open={snackbar.show} autoHideDuration={6000} onClose={handleClose}>
      <Alert onClose={handleClose} severity={snackbar.severity} elevation={6} variant="filled">
        {snackbar.message}
      </Alert>
    </Snackbar>
  )
}
