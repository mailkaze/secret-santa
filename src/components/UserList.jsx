import { useEffect, useState } from 'react'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { getUsers } from '../services'

function initial(name) {
  return name?.trim()?.[0]?.toUpperCase() ?? '?'
}

// Lista de miembros o de solicitudes. renderAction solo se pasa a quien puede ejecutar la acción.
export default function UserList({ uids, label, adminUid, shufflers = [], receiverUid, renderAction, emptyText }) {
  const key = uids.join(',')
  // null mientras se cargan los perfiles
  const [users, setUsers] = useState(null)

  // Solo se vuelven a pedir los perfiles cuando cambia la lista de uids
  useEffect(() => {
    let active = true
    // Si falla, se mantiene la última lista conocida
    getUsers(key ? key.split(',') : []).then(result => active && setUsers(result)).catch(() => {})
    return () => { active = false }
  }, [key])

  if (users === null) {
    return (
      <Stack spacing={1} role="status" aria-label={`Cargando: ${label}`}>
        {uids.slice(0, 3).map(uid => <Skeleton key={uid} variant="rounded" height={56} />)}
      </Stack>
    )
  }

  if (users.length === 0) {
    return <Typography sx={{ color: 'text.secondary' }}>{emptyText}</Typography>
  }

  return (
    <List aria-label={label} disablePadding>
      {users.map((person, i) => {
        const statuses = []
        if (adminUid === person.uid) statuses.push(<Chip key="admin" size="small" color="secondary" label="Administrador" />)
        if (receiverUid === person.uid) statuses.push(<Chip key="receiver" size="small" color="primary" label="Le regalas tú" />)
        if (shufflers.includes(person.uid)) statuses.push(<Chip key="shuffled" size="small" color="success" variant="outlined" label="Ya ha sorteado" />)
        return (
          <ListItem key={person.uid} divider={i < users.length - 1} disableGutters secondaryAction={renderAction?.(person)}>
            <ListItemAvatar>
              <Avatar aria-hidden="true" sx={{ bgcolor: adminUid === person.uid ? 'secondary.main' : 'secondary.light', fontWeight: 800 }}>
                {initial(person.name)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={person.name}
              secondary={(
                <>
                  <Typography component="span" variant="body2" sx={{ display: 'block', color: 'text.secondary', overflowWrap: 'anywhere' }}>
                    {person.email}
                  </Typography>
                  {statuses.length > 0 && (
                    <Stack component="span" direction="row" sx={{ gap: 0.75, flexWrap: 'wrap', mt: 0.5 }}>{statuses}</Stack>
                  )}
                </>
              )}
              slotProps={{ primary: { sx: { fontWeight: 700, overflowWrap: 'anywhere' } }, secondary: { component: 'div' } }}
            />
          </ListItem>
        )
      })}
    </List>
  )
}
