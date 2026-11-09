import { useSelector, useDispatch } from 'react-redux'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardActionArea from '@mui/material/CardActionArea'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Icon from '@mui/material/Icon'
import Tooltip from '@mui/material/Tooltip'
import Zoom from '@mui/material/Zoom'
import { red } from '@mui/material/colors'
import { openDashboard, setSearch, notify, leaveOrDeleteGroup } from '../redux/actions'
import { cancelRequest, getGroup, sendRequest } from '../services'
import { GENERIC_ERROR } from '../utils'

const MEMBERSHIP = {
  member: { icon: 'clear', tip: 'Salir del grupo' },
  requested: { icon: 'how_to_reg', tip: 'Solicitud enviada' },
  none: { icon: 'person_add', tip: 'Enviar solicitud de miembro' },
}

export default function GroupCard({ group }) {
  const uid = useSelector(state => state.user?.uid)
  const isMember = useSelector(state => state.userGroups.some(g => g.id === group.id))
  const hasRequested = useSelector(state => state.userRequests.some(g => g.id === group.id))
  const status = isMember ? 'member' : hasRequested ? 'requested' : 'none'
  const { icon, tip } = MEMBERSHIP[status]
  const dispatch = useDispatch()

  function handleOpen() {
    if (isMember) {
      dispatch(openDashboard(group.id))
    } else {
      dispatch(notify('warning', 'No eres miembro de este grupo.'))
    }
  }

  async function handleMembership() {
    try {
      if (isMember) {
        const groupData = await getGroup(group.id)
        if (groupData && await dispatch(leaveOrDeleteGroup(groupData))) dispatch(setSearch(''))
      } else if (hasRequested) {
        if (!window.confirm('¿Cancelar solicitud?')) return
        await cancelRequest(group.id, uid)
        dispatch(notify('info', 'Has cancelado tu solicitud de ingreso a este grupo.'))
        dispatch(setSearch(''))
      } else {
        await sendRequest(group.id, uid)
        dispatch(notify('info', 'Se ha enviado tu solicitud. Cuando se acepte, podrás acceder a este grupo.'))
        dispatch(setSearch(''))
      }
    } catch {
      dispatch(notify('error', GENERIC_ERROR))
    }
  }

  return (
    <Card sx={{ width: '100%', mb: '5px', display: 'flex', alignItems: 'center' }}>
      <CardActionArea onClick={handleOpen}>
        <CardHeader
          sx={{ textAlign: 'left' }}
          avatar={
            <Avatar sx={{ bgcolor: red[500] }}>
              <Icon>group</Icon>
            </Avatar>
          }
          title={group.name}
        />
      </CardActionArea>
      <Tooltip placement="top" slots={{ transition: Zoom }} disableFocusListener title={tip} arrow>
        <IconButton aria-label={tip} onClick={handleMembership} sx={{ mx: 1 }}>
          <Icon>{icon}</Icon>
        </IconButton>
      </Tooltip>
    </Card>
  )
}
