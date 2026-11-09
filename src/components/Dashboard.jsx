import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CelebrationIcon from '@mui/icons-material/Celebration'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import LogoutIcon from '@mui/icons-material/Logout'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import ShareIcon from '@mui/icons-material/Share'
import { notify, leaveOrDeleteGroup } from '../redux/actions'
import {
  acceptRequest,
  getReceiver,
  getUsers,
  markAsShuffled,
  removeMember,
  resetShuffle,
  startShuffleStage,
  subscribeToGroup,
  subscribeToWish,
} from '../services'
import { GENERIC_ERROR } from '../utils'
import { colors } from '../theme'
import { useConfirm } from './ConfirmDialog'
import { groupPath, navigate } from './routing'
import EmptyState from './EmptyState'
import GroupPreview from './GroupPreview'
import Page from './Page'
import PresentCard from './PresentCard'
import RateCard from './RateCard'
import SatisfactionCard from './SatisfactionCard'
import SectionCard from './SectionCard'
import ShuffleModal from './ShuffleModal'
import Stars, { HEADER_STARS } from './Stars'
import UserList from './UserList'
import WishCard from './WishCard'

function plural(count, singular, pluralForm) {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

// Página de un grupo: panel para miembros, vista previa para el resto
export default function Dashboard({ groupId }) {
  const uid = useSelector(state => state.user?.uid)
  // undefined mientras carga; null si no existe o no se puede leer
  const [group, setGroup] = useState(undefined)

  useEffect(() => {
    let wasMember = false
    return subscribeToGroup(groupId, data => {
      const isMember = Boolean(data?.users?.includes(uid))
      // Si te expulsan, sales o se borra el grupo mientras lo ves, vuelves a la lista
      if (wasMember && !isMember) {
        navigate('/', { replace: true })
        return
      }
      wasMember = isMember
      setGroup(data)
    })
  }, [groupId, uid])

  if (group === undefined) {
    return (
      <Page>
        <Stack spacing={2} role="status" aria-label="Cargando el grupo">
          <Skeleton variant="rounded" height={170} sx={{ borderRadius: '16px' }} />
          <Skeleton variant="rounded" height={140} sx={{ borderRadius: '16px' }} />
          <Skeleton variant="rounded" height={200} sx={{ borderRadius: '16px' }} />
        </Stack>
      </Page>
    )
  }
  if (group === null) {
    return (
      <Page>
        <EmptyState title="No hemos encontrado este grupo.">
          Puede que se haya eliminado o que el enlace no esté completo.
        </EmptyState>
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button href="#/" variant="contained" startIcon={<ArrowBackIcon />}>Volver a tus grupos</Button>
        </Box>
      </Page>
    )
  }
  if (!group.users.includes(uid)) return <GroupPreview group={group} />
  return <MemberDashboard group={group} />
}

function GroupHeader({ group, isAdmin, onInvite }) {
  const shuffleStage = Boolean(group.shuffleStage)
  return (
    <Card component="section" aria-labelledby="group-title" sx={{ p: 2.5, bgcolor: 'secondary.main', color: 'secondary.contrastText', position: 'relative', overflow: 'hidden' }}>
      <Stars positions={HEADER_STARS} />
      <Box sx={{ position: 'relative' }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <IconButton href="#/" aria-label="Volver a tus grupos" color="inherit" edge="start">
            <ArrowBackIcon />
          </IconButton>
          <Chip
            label={shuffleStage ? 'En sorteo' : 'Preparando el grupo'}
            color={shuffleStage ? 'primary' : 'default'}
            sx={shuffleStage ? undefined : { bgcolor: 'rgba(237, 242, 244, 0.14)', color: 'inherit' }}
          />
        </Stack>
        <Typography id="group-title" variant="h1" component="h1" sx={{ overflowWrap: 'anywhere' }}>
          {group.name}
        </Typography>
        <Typography sx={{ color: '#c5cbd6', mt: 0.5 }}>
          {plural(group.users.length, 'miembro', 'miembros')}{isAdmin ? ' · Administras este grupo' : ''}
        </Typography>
        {!shuffleStage && (
          <Button
            variant="contained"
            startIcon={<ShareIcon />}
            onClick={onInvite}
            sx={{ mt: 2, bgcolor: colors.snow, color: colors.navy, '&:hover': { bgcolor: '#ffffff' } }}
          >
            Invitar
          </Button>
        )}
      </Box>
    </Card>
  )
}

function MemberDashboard({ group }) {
  const uid = useSelector(state => state.user?.uid)
  const dispatch = useDispatch()
  const confirm = useConfirm()
  const [receiver, setReceiver] = useState(null)
  const [receiverWish, setReceiverWish] = useState(null)
  const [revealNames, setRevealNames] = useState([])
  // Mientras se revela el sorteo, la tarjeta del regalo sigue oculta para no destripar el resultado
  const [revealPending, setRevealPending] = useState(false)
  const [busy, setBusy] = useState(false)

  const isAdmin = group.admin === uid
  const shuffleStage = Boolean(group.shuffleStage)
  const shufflers = group.shufflers ?? []
  const hasShuffled = shuffleStage && shufflers.includes(uid)

  useEffect(() => {
    if (!hasShuffled) return
    let active = true
    getReceiver(group.id, uid)
      .then(data => active && setReceiver(data))
      .catch(() => {
        if (!active) return
        setRevealPending(false)
        dispatch(notify('error', GENERIC_ERROR))
      })
    return () => {
      active = false
      setReceiver(null)
    }
  }, [hasShuffled, group.id, uid, dispatch])

  // El deseo de quien te toca se escucha en directo por si lo cambia después del sorteo
  const receiverUid = receiver?.uid
  useEffect(() => {
    if (!receiverUid) return
    return subscribeToWish(group.id, receiverUid, text => setReceiverWish({ uid: receiverUid, text }))
  }, [group.id, receiverUid])

  async function run(operation, severity, message) {
    setBusy(true)
    try {
      await operation()
      if (message) dispatch(notify(severity, message))
      return true
    } catch {
      dispatch(notify('error', GENERIC_ERROR))
      return false
    } finally {
      setBusy(false)
    }
  }

  async function startDraw() {
    if (group.users.length < 2) {
      dispatch(notify('error', 'Se necesitan al menos dos miembros en el grupo para poder sortear.'))
      return
    }
    const accepted = await confirm({
      title: `¿Empezar el sorteo de «${group.name}»?`,
      message: 'Cada miembro podrá pulsar «Sortear» para descubrir a quién le regala. Mientras dure el sorteo no se podrán añadir ni expulsar miembros.',
      confirmLabel: 'Empezar sorteo',
    })
    if (accepted) run(() => startShuffleStage(group), 'success', 'El sorteo ha empezado: ya podéis pulsar «Sortear».')
  }

  async function resetDraw() {
    const accepted = await confirm({
      title: `¿Reiniciar el sorteo de «${group.name}»?`,
      message: (
        <>
          <p>Se borrarán el sorteo, los deseos y las valoraciones.</p>
          <p>Se mantienen los miembros y las solicitudes.</p>
        </>
      ),
      confirmLabel: 'Reiniciar sorteo',
      destructive: true,
    })
    if (accepted) run(() => resetShuffle(group), 'info', 'El sorteo se ha reiniciado. Cuando estéis listos, podéis empezar otro.')
  }

  async function shuffle() {
    setRevealPending(true)
    const done = await run(async () => {
      await markAsShuffled(group.id, uid)
      const members = await getUsers(group.users)
      setRevealNames(members.map(member => member.name))
    })
    if (!done) setRevealPending(false)
  }

  function closeReveal() {
    setRevealNames([])
    setRevealPending(false)
  }

  async function expel(person) {
    const accepted = await confirm({
      title: `¿Expulsar a ${person.name} de «${group.name}»?`,
      message: 'Dejará de ver el grupo y se borrará su deseo. Podrá volver a pedir unirse.',
      confirmLabel: `Expulsar a ${person.name}`,
      destructive: true,
    })
    if (accepted) run(() => removeMember(group.id, person.uid), 'success', `Has expulsado a ${person.name} del grupo.`)
  }

  function accept(person) {
    run(() => acceptRequest(group.id, person.uid), 'success', `${person.name} ya forma parte del grupo.`)
  }

  async function leave() {
    if (await dispatch(leaveOrDeleteGroup(group, confirm))) navigate('/', { replace: true })
  }

  async function invite() {
    const url = `${window.location.origin}${window.location.pathname}#${groupPath(group.id)}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Secret Santa', text: `Únete a «${group.name}» en Secret Santa`, url })
      } catch (error) {
        if (error?.name !== 'AbortError') dispatch(notify('error', GENERIC_ERROR))
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      dispatch(notify('success', 'Enlace copiado. Envíalo a quien quieras invitar.'))
    } catch {
      dispatch(notify('info', `Copia este enlace para invitar: ${url}`))
    }
  }

  function renderDraw() {
    if (!hasShuffled) {
      return (
        <Card component="section" aria-labelledby="draw-title" sx={{ p: 3, bgcolor: 'primary.main', color: 'primary.contrastText', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <Typography id="draw-title" variant="h2" component="h2">¡Ha llegado el momento!</Typography>
          <Typography sx={{ mt: 0.5, mb: 2.5 }}>Pulsa el botón para descubrir a quién le regalas.</Typography>
          <Button
            size="large"
            variant="contained"
            onClick={shuffle}
            disabled={busy}
            startIcon={<Box component="img" src="/caja-de-regalo.svg" alt="" sx={{ height: 32 }} />}
            sx={{ bgcolor: colors.snow, color: colors.navy, fontSize: '1.25rem', px: 4, '&:hover': { bgcolor: '#ffffff' } }}
          >
            Sortear
          </Button>
        </Card>
      )
    }
    if (revealPending || !receiver) {
      return (
        <Card component="section" aria-label="Tu sorteo" sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={28} aria-label="Cargando tu sorteo" />
          <Typography>Preparando tu sorteo…</Typography>
        </Card>
      )
    }
    const wish = receiverWish?.uid === receiver.uid ? receiverWish.text : receiver.wish
    return (
      <>
        <PresentCard name={receiver.name} wish={wish} />
        <RateCard groupId={group.id} uid={uid} />
      </>
    )
  }

  const showSatisfaction = shuffleStage && group.ratingCount > 0 && group.ratingCount >= group.users.length / 2
  const canManageMembers = isAdmin && !shuffleStage

  return (
    <Page>
      <Stack spacing={2}>
        <GroupHeader group={group} isAdmin={isAdmin} onInvite={invite} />

        {!shuffleStage && (
          <SectionCard id="start-title" title="El sorteo">
            {isAdmin
              ? (
                <>
                  <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                    Cuando estéis todos, empieza el sorteo. A partir de ese momento no se podrán añadir ni expulsar miembros.
                  </Typography>
                  <Button variant="contained" size="large" startIcon={<CelebrationIcon />} onClick={startDraw} disabled={busy}>
                    Empezar sorteo
                  </Button>
                </>
              )
              : (
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <HourglassTopIcon sx={{ color: 'text.secondary' }} />
                  <Typography sx={{ color: 'text.secondary' }}>
                    Esperando a que quien administra el grupo empiece el sorteo. Mientras tanto, cuenta qué te gustaría recibir.
                  </Typography>
                </Stack>
              )}
          </SectionCard>
        )}

        {shuffleStage && renderDraw()}

        <WishCard groupId={group.id} uid={uid} />

        {showSatisfaction && <SatisfactionCard mean={group.ratingSum / group.ratingCount} />}

        <SectionCard id="members-title" title={`Miembros (${group.users.length})`}>
          <UserList
            uids={group.users}
            label="Miembros del grupo"
            adminUid={group.admin}
            shufflers={shuffleStage ? shufflers : []}
            receiverUid={revealPending ? undefined : receiver?.uid}
            renderAction={canManageMembers
              ? person => person.uid !== group.admin && (
                <IconButton aria-label={`Expulsar a ${person.name}`} onClick={() => expel(person)} disabled={busy} edge="end">
                  <PersonRemoveIcon />
                </IconButton>
              )
              : undefined}
          />
        </SectionCard>

        {canManageMembers && (
          <SectionCard id="requests-title" title="Solicitudes para unirse">
            <UserList
              uids={group.requests ?? []}
              label="Solicitudes para unirse"
              emptyText="No hay solicitudes pendientes."
              renderAction={person => (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<PersonAddAlt1Icon />}
                  aria-label={`Aceptar a ${person.name}`}
                  onClick={() => accept(person)}
                  disabled={busy}
                >
                  Aceptar
                </Button>
              )}
            />
          </SectionCard>
        )}

        <SectionCard id="danger-title" title="Zona de peligro" danger>
          <Stack spacing={2.5}>
            {isAdmin && shuffleStage && (
              <Box>
                <Typography sx={{ color: 'text.secondary', mb: 1 }}>
                  Borra el sorteo, los deseos y las valoraciones para hacer otro. Se mantienen los miembros y las solicitudes.
                </Typography>
                <Button variant="outlined" color="error" startIcon={<RestartAltIcon />} onClick={resetDraw} disabled={busy}>
                  Reiniciar sorteo
                </Button>
              </Box>
            )}
            {isAdmin
              ? (
                <Box>
                  <Typography sx={{ color: 'text.secondary', mb: 1 }}>
                    Elimina el grupo para todo el mundo, con su sorteo, sus deseos y sus valoraciones.
                  </Typography>
                  <Button variant="contained" color="error" startIcon={<DeleteOutlinedIcon />} onClick={leave} disabled={busy}>
                    Eliminar grupo
                  </Button>
                </Box>
              )
              : (
                <Box>
                  <Typography sx={{ color: 'text.secondary', mb: 1 }}>
                    {shuffleStage
                      ? 'No puedes salir del grupo mientras dura el sorteo.'
                      : 'Dejarás de ver el grupo y se borrará tu deseo.'}
                  </Typography>
                  <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={leave} disabled={busy || shuffleStage}>
                    Salir del grupo
                  </Button>
                </Box>
              )}
          </Stack>
        </SectionCard>
      </Stack>

      <ShuffleModal
        open={revealNames.length > 0 && receiver !== null}
        onClose={closeReveal}
        names={revealNames}
        receiver={receiver?.name ?? ''}
      />
    </Page>
  )
}
