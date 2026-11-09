import { Fragment, useEffect, useState } from 'react'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'
import Zoom from '@mui/material/Zoom'
import Icon from '@mui/material/Icon'
import IconButton from '@mui/material/IconButton'
import { getUsers } from '../services'

function TipIcon({ title, children }) {
  return (
    <Tooltip placement="top" slots={{ transition: Zoom }} disableFocusListener title={title} arrow>
      <Icon aria-label={title}>{children}</Icon>
    </Tooltip>
  )
}

// Lista de miembros o de solicitudes. "action" solo se muestra a quien puede ejecutarla.
export default function UserList({ uids, label, adminUid, shufflers = [], receiverUid, action }) {
  const key = uids.join(',')
  const [users, setUsers] = useState([])

  // Solo se vuelven a pedir los perfiles cuando cambia la lista de uids
  useEffect(() => {
    let active = true
    getUsers(key ? key.split(',') : []).then(result => active && setUsers(result))
    return () => { active = false }
  }, [key])

  return (
    <List aria-label={label} sx={{ width: '90%', m: 'auto', maxWidth: 360, bgcolor: 'background.paper' }}>
      {users.map(person => (
        <Fragment key={person.uid}>
          <ListItem>
            <ListItemIcon>
              {adminUid === person.uid
                ? <TipIcon title="Administrador del grupo">admin_panel_settings</TipIcon>
                : action
                  ? (
                    <Tooltip placement="top" slots={{ transition: Zoom }} disableFocusListener title={action.title} arrow>
                      <IconButton edge="start" aria-label={`${action.title}: ${person.name}`} onClick={() => action.onClick(person)}>
                        <Icon>{action.icon}</Icon>
                      </IconButton>
                    </Tooltip>
                  )
                  : <Icon>person</Icon>
              }
            </ListItemIcon>
            <ListItemText primary={person.name} secondary={person.email} />
            {receiverUid === person.uid && <TipIcon title="¡Tú le regalas a esta persona!">card_giftcard</TipIcon>}
            {shufflers.includes(person.uid) && <TipIcon title="Esta persona ya sorteó">done</TipIcon>}
          </ListItem>
          <Divider />
        </Fragment>
      ))}
    </List>
  )
}
