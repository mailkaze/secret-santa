import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import GroupsIcon from '@mui/icons-material/Groups'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
import CancelScheduleSendIcon from '@mui/icons-material/CancelScheduleSend'
import { setSearch, notify } from '../redux/actions'
import { cancelRequest, sendRequest } from '../services'
import { GENERIC_ERROR } from '../utils'
import { useConfirm } from './ConfirmDialog'
import { groupPath } from './routing'

// Tarjeta de un grupo: abre su página (panel o vista previa) y permite pedir unirse o cancelar la solicitud
export default function GroupCard({ group }) {
  const uid = useSelector(state => state.user?.uid)
  const isMember = useSelector(state => state.userGroups.some(g => g.id === group.id))
  const hasRequested = useSelector(state => state.userRequests.some(g => g.id === group.id))
  const [busy, setBusy] = useState(false)
  const confirm = useConfirm()
  const dispatch = useDispatch()

  async function run(operation, message) {
    setBusy(true)
    try {
      await operation()
      dispatch(notify('info', message))
      dispatch(setSearch(''))
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

  // admin y shuffleStage solo llegan si el listado de grupos los incluye
  const chips = []
  if (isMember && group.admin === uid) chips.push(<Chip key="admin" size="small" color="secondary" label="Administrador" />)
  if (isMember && group.shuffleStage) chips.push(<Chip key="stage" size="small" color="primary" label="En sorteo" />)
  if (!isMember && hasRequested) chips.push(<Chip key="request" size="small" color="warning" variant="outlined" label="Solicitud pendiente" />)

  return (
    <Card component="li" sx={{ display: 'flex', alignItems: 'center' }}>
      <CardActionArea
        href={`#${groupPath(group.id)}`}
        onClick={() => dispatch(setSearch(''))}
        sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 2, p: 2, minHeight: 72 }}
      >
        <Avatar aria-hidden="true" sx={{ bgcolor: isMember ? 'primary.main' : 'secondary.main' }}>
          <GroupsIcon />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="span" variant="subtitle1" sx={{ display: 'block', fontWeight: 800, lineHeight: 1.3, overflowWrap: 'anywhere' }}>
            {group.name}
          </Typography>
          {chips.length > 0 && <Stack direction="row" sx={{ mt: 0.5, gap: 0.75, flexWrap: 'wrap' }}>{chips}</Stack>}
        </Box>
        {isMember && <ChevronRightIcon sx={{ color: 'text.secondary' }} />}
      </CardActionArea>
      {!isMember && (
        <Box sx={{ pr: 2, flexShrink: 0 }}>
          {hasRequested
            ? (
              <Button variant="outlined" color="secondary" size="small" startIcon={<CancelScheduleSendIcon />} aria-label={`Cancelar solicitud a ${group.name}`} onClick={cancel} disabled={busy}>
                Cancelar
              </Button>
            )
            : (
              <Button variant="contained" size="small" startIcon={<PersonAddAlt1Icon />} aria-label={`Solicitar unirme a ${group.name}`} onClick={join} disabled={busy}>
                Solicitar
              </Button>
            )}
        </Box>
      )}
    </Card>
  )
}
