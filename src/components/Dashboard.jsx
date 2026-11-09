import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { styled } from '@mui/material/styles'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Icon from '@mui/material/Icon'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import Zoom from '@mui/material/Zoom'
import { closeDashboard, setSelectedGroup, notify, leaveOrDeleteGroup } from '../redux/actions'
import {
  acceptRequest,
  getReceiver,
  getUsers,
  markAsShuffled,
  removeMember,
  resetShuffle,
  saveWish,
  startShuffleStage,
  subscribeToGroup,
  subscribeToWish,
} from '../services'
import { DEFAULT_WISH, GENERIC_ERROR } from '../utils'
import PresentCard from './PresentCard'
import ShuffleModal from './ShuffleModal'
import RateCard from './RateCard'
import SatisfactionCard from './SatisfactionCard'
import UserList from './UserList'

const DashboardStyled = styled('div')`
  width: 100%;
  height: 100%;
  position: relative;
  padding-bottom: 16px;

  #close-button {
    position: absolute;
    top: 0;
    left: 4px;
    margin-left: 5px;
    padding: 0;
  }

  #close-button .MuiIcon-root {
    font-size: 2.4em;
  }

  h5 {
    margin-top: 10px;
    font-weight: 500;
  }

  #readyButton {
    margin-top: 8px;
  }

  #shuffleButton {
    margin-bottom: 20px;
    padding: 10px 30px;
  }

  form {
    margin: 20px 0;
  }

  form > button {
    margin: 0 0 0 5px;
    height: 44px;
    margin-top: 0 !important;
    width: 80px;
  }

  #outlined-helperText {
    margin-top: 8px;
    height: .5em;
    padding-top: 10px;
  }

  #gift-image {
    height: 40px;
  }

  .members, .requests {
    padding-top: 20px;
  }

  #shuffle-text {
    margin-left: 10px;
  }

  #red-buttons {
    margin: auto;
    width: 90%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`

export default function Dashboard() {
  const group = useSelector(state => state.selectedGroup)
  const uid = useSelector(state => state.user?.uid)
  const dispatch = useDispatch()
  const [wish, setWish] = useState('')
  const [receiver, setReceiver] = useState(null)
  const [shuffleNames, setShuffleNames] = useState([])

  const groupId = group.id
  const loaded = Array.isArray(group.users)
  const isAdmin = group.admin === uid
  const shuffleStage = loaded && group.shuffleStage
  const hasShuffled = shuffleStage && group.shufflers.includes(uid)

  // Escucha en tiempo real del grupo; se cancela al salir. Si te expulsan o se borra, vuelves a la lista.
  useEffect(() => subscribeToGroup(groupId, data => {
    if (data && data.users.includes(uid)) {
      dispatch(setSelectedGroup(data))
    } else {
      dispatch(closeDashboard())
    }
  }), [groupId, uid, dispatch])

  useEffect(() => subscribeToWish(groupId, uid, setWish), [groupId, uid])

  useEffect(() => {
    if (!hasShuffled) return
    let active = true
    getReceiver(groupId, uid).then(data => active && setReceiver(data))
    return () => {
      active = false
      setReceiver(null)
    }
  }, [hasShuffled, groupId, uid])

  async function run(operation, successSeverity, successMessage) {
    try {
      await operation()
      if (successMessage) dispatch(notify(successSeverity, successMessage))
    } catch {
      dispatch(notify('error', GENERIC_ERROR))
    }
  }

  function updateWish(e) {
    e.preventDefault()
    const text = wish.trim() || DEFAULT_WISH
    run(() => saveWish(groupId, uid, text), 'success', 'Tu nuevo regalo ideal se ha guardado correctamente.')
  }

  function onReady() {
    if (group.users.length < 2) {
      dispatch(notify('error', 'Se necesitan al menos dos miembros en el grupo para poder sortear.'))
      return
    }
    if (!window.confirm('Al entrar en la etapa de sorteo los miembros verán el botón SORTEAR y ya no se podrán añadir o borrar miembros. ¿Iniciar etapa de sorteo?')) return
    run(() => startShuffleStage(group), 'success', 'Etapa de sorteo, ¡ahora los miembros de este grupo pueden pulsar el botón sortear para ver a quién les toca regalar!')
  }

  function onResetShuffle() {
    if (!window.confirm('¿Quieres borrar todos los datos de este intercambio de regalos para empezar uno nuevo? No se borrarán los miembros del grupo ni las solicitudes de ingreso')) return
    run(() => resetShuffle(group), 'info', 'El grupo se ha reiniciado para realizar un nuevo sorteo.')
  }

  // Animación del sorteo: se muestra cuando ya se conocen los nombres y el destinatario
  function reveal() {
    run(async () => {
      await markAsShuffled(groupId, uid)
      const members = await getUsers(group.users)
      setShuffleNames(members.map(member => member.name))
    })
  }

  function expel(person) {
    if (!window.confirm('¿Eliminar a esta persona del grupo?')) return
    run(() => removeMember(groupId, person.uid), 'success', 'Usuario expulsado con éxito.')
  }

  function accept(person) {
    run(() => acceptRequest(groupId, person.uid), 'success', 'Has añadido un nuevo miembro a tu grupo.')
  }

  if (!loaded) return null

  const showSatisfaction = shuffleStage && group.ratingCount > 0 && group.ratingCount >= group.users.length / 2

  return (
    <DashboardStyled>
      <Tooltip placement="top" slots={{ transition: Zoom }} disableFocusListener title="Volver a la lista de grupos" arrow>
        <IconButton id="close-button" color="inherit" aria-label="Volver a la lista de grupos" onClick={() => dispatch(closeDashboard())}>
          <Icon>arrow_back</Icon>
        </IconButton>
      </Tooltip>
      <Typography variant="h5">{group.name}</Typography>

      {isAdmin && <Typography variant="body2">Eres el administrador de este grupo.</Typography>}
      {!shuffleStage && (isAdmin
        ? <Button variant="contained" color="primary" id="readyButton" onClick={onReady}>Listo para sorteo</Button>
        : <Typography variant="body2">Esperando a que se complete el grupo...</Typography>
      )}
      <form onSubmit={updateWish}>
        <TextField
          id="outlined-helperText"
          label="¿Qué quieres que te regalen?"
          value={wish}
          onChange={e => setWish(e.target.value)}
          variant="outlined"
          slotProps={{ htmlInput: { maxLength: 500 } }}
        />
        <Button variant="contained" color="primary" type="submit">Guardar</Button>
      </form>
      {shuffleStage && (hasShuffled
        ? (
          <div>
            {receiver && <PresentCard name={receiver.name} wish={receiver.wish} />}
            <RateCard groupId={groupId} uid={uid} />
          </div>
        )
        : (
          <Button variant="contained" color="secondary" id="shuffleButton" size="large" onClick={reveal}>
            <img src="/caja-de-regalo.svg" id="gift-image" alt="" /><span id="shuffle-text">SORTEAR</span>
          </Button>
        )
      )}
      {showSatisfaction && <SatisfactionCard mean={group.ratingSum / group.ratingCount} />}
      <ShuffleModal
        open={shuffleNames.length > 0 && receiver !== null}
        onClose={() => setShuffleNames([])}
        names={shuffleNames}
        receiver={receiver?.name}
      />
      <div className="members">
        <Typography variant="button">Miembros de este grupo:</Typography>
        <UserList
          uids={group.users}
          label="Miembros de este grupo"
          adminUid={group.admin}
          shufflers={group.shufflers}
          receiverUid={receiver?.uid}
          action={isAdmin && !shuffleStage ? { icon: 'person_remove_alt_1', title: 'Expulsar miembro', onClick: expel } : null}
        />
      </div>

      {isAdmin && !shuffleStage && (
        <div className="requests">
          <Typography variant="button">Solicitudes para unirse:</Typography>
          <UserList
            uids={group.requests}
            label="Solicitudes para unirse"
            action={{ icon: 'person_add_alt_1', title: 'Incluir a esta persona en el grupo', onClick: accept }}
          />
        </div>
      )}
      <div id="red-buttons">
        {isAdmin && (
          <Button variant="contained" color="secondary" onClick={onResetShuffle}>
            Reiniciar sorteo
          </Button>
        )}
        <Button
          variant="contained"
          color="secondary"
          startIcon={<Icon>{isAdmin ? 'delete' : 'clear'}</Icon>}
          onClick={() => dispatch(leaveOrDeleteGroup(group))}
        >
          {isAdmin ? 'eliminar grupo' : 'abandonar grupo'}
        </Button>
      </div>
    </DashboardStyled>
  )
}
