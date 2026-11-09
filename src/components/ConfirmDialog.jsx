import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'

const ConfirmContext = createContext(null)

// confirm({ title, message, confirmLabel, cancelLabel, destructive }) devuelve una promesa con true o false
export function useConfirm() {
  return useContext(ConfirmContext)
}

export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null)
  const [open, setOpen] = useState(false)

  const confirm = useCallback(options => new Promise(resolve => {
    setRequest({ ...options, resolve })
    setOpen(true)
  }), [])

  function answer(value) {
    request.resolve(value)
    setOpen(false)
  }

  // Si se cambia de pantalla con el diálogo abierto, se cancela: la acción era de la pantalla anterior
  useEffect(() => {
    if (!open) return
    function cancel() {
      request.resolve(false)
      setOpen(false)
    }
    window.addEventListener('hashchange', cancel)
    return () => window.removeEventListener('hashchange', cancel)
  }, [open, request])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <Dialog
          open={open}
          onClose={() => answer(false)}
          aria-labelledby="confirm-title"
          aria-describedby="confirm-message"
          slotProps={{ transition: { onExited: () => setRequest(null) } }}
        >
          <DialogTitle id="confirm-title" sx={{ fontWeight: 800 }}>{request.title}</DialogTitle>
          <DialogContent>
            <DialogContentText id="confirm-message" component="div" sx={{ color: 'text.secondary', '& p': { m: 0, mb: 1 } }}>
              {request.message}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, flexWrap: 'wrap' }}>
            <Button onClick={() => answer(false)} color="secondary">
              {request.cancelLabel ?? 'Cancelar'}
            </Button>
            <Button
              onClick={() => answer(true)}
              variant="contained"
              color={request.destructive ? 'error' : 'primary'}
              autoFocus={!request.destructive}
            >
              {request.confirmLabel}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </ConfirmContext.Provider>
  )
}
