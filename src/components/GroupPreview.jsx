import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
import { notify } from '../redux/actions'
import { cancelRequest, sendRequest } from '../services'
import { GENERIC_ERROR } from '../utils'
import { useConfirm } from './ConfirmDialog'
import Page from './Page'
import Stars, { CORNER_STARS } from './Stars'

// Lo que ve quien abre el enlace de un grupo del que aún no es miembro
export default function GroupPreview({ group }) {
  const uid = useSelector(state => state.user?.uid)
  const hasRequested = Boolean(group.requests?.includes(uid))
  const [busy, setBusy] = useState(false)
  const confirm = useConfirm()
  const dispatch = useDispatch()

  async function run(operation, message) {
    setBusy(true)
    try {
      await operation()
      dispatch(notify('info', message))
    } catch {
      dispatch(notify('error', GENERIC_ERROR))
    } finally {
      setBusy(false)
    }
  }

  function join() {
    run(() => sendRequest(group.id, uid), `Solicitud enviada a «${group.name}». Podrás entrar cuando la acepten.`)
  }

  async function cancel() {
    const accepted = await confirm({
      title: `¿Cancelar tu solicitud para unirte a «${group.name}»?`,
      message: 'Si cambias de idea, podrás volver a pedirlo más adelante.',
      confirmLabel: 'Cancelar solicitud',
      cancelLabel: 'Mantener solicitud',
      destructive: true,
    })
    if (accepted) run(() => cancelRequest(group.id, uid), `Has cancelado tu solicitud para unirte a «${group.name}».`)
  }

  const members = group.users.length

  return (
    <Page>
      <Card component="section" aria-labelledby="preview-title">
        <Box sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText', p: 3, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <Stars positions={CORNER_STARS} />
          <Box sx={{ position: 'relative' }}>
            <Box component="img" src="/caja-de-regalo.svg" alt="" sx={{ height: 64, mb: 1.5 }} />
            <Typography id="preview-title" variant="h1" component="h1" sx={{ overflowWrap: 'anywhere' }}>{group.name}</Typography>
            <Typography sx={{ color: '#c5cbd6', mt: 0.5 }}>{members} {members === 1 ? 'miembro' : 'miembros'}</Typography>
          </Box>
        </Box>
        <Stack spacing={1.5} sx={{ p: 3, alignItems: 'flex-start' }}>
          <Typography sx={{ fontWeight: 700 }}>No eres miembro de este grupo.</Typography>
          {hasRequested
            ? (
              <>
                <Typography sx={{ color: 'text.secondary' }}>
                  Tu solicitud está pendiente. Cuando quien administra el grupo la acepte, podrás entrar.
                </Typography>
                <Button variant="outlined" color="secondary" onClick={cancel} disabled={busy}>Cancelar solicitud</Button>
              </>
            )
            : (
              <>
                <Typography sx={{ color: 'text.secondary' }}>
                  {group.shuffleStage
                    ? 'Este grupo ya está en pleno sorteo, pero puedes pedir unirte para el próximo.'
                    : 'Pide unirte y, cuando te acepten, podrás participar en el sorteo.'}
                </Typography>
                <Button variant="contained" startIcon={<PersonAddAlt1Icon />} onClick={join} disabled={busy}>Solicitar unirme</Button>
              </>
            )}
        </Stack>
      </Card>
      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Button href="#/" color="secondary" startIcon={<ArrowBackIcon />}>Volver a tus grupos</Button>
      </Box>
    </Page>
  )
}
