import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import GroupCard from './GroupCard'
import SearchField from './SearchField'
import NewGroupModal from './NewGroupModal'
import EmptyState from './EmptyState'
import Page from './Page'
import { searchGroups } from '../services'
import { notify } from '../redux/actions'
import { GENERIC_ERROR } from '../utils'

function GroupCards({ groups }) {
  return (
    <Stack component="ul" spacing={1.5} sx={{ listStyle: 'none', p: 0, m: 0 }}>
      {groups.map(group => <GroupCard group={group} key={group.id} />)}
    </Stack>
  )
}

function Section({ id, title, children }) {
  return (
    <Box component="section" aria-labelledby={id} sx={{ mb: 4 }}>
      <Typography id={id} variant="h2" component="h2" sx={{ mb: 1.5 }}>{title}</Typography>
      {children}
    </Box>
  )
}

export default function GroupsList() {
  const userGroups = useSelector(state => state.userGroups)
  const userRequests = useSelector(state => state.userRequests)
  const groupsLoaded = useSelector(state => state.groupsLoaded)
  const search = useSelector(state => state.search)
  // Los resultados se guardan junto a su búsqueda para no mostrar los de una búsqueda anterior
  const [results, setResults] = useState({ search: '', groups: [] })
  const dispatch = useDispatch()

  useEffect(() => {
    if (search === '') return
    let active = true
    searchGroups(search)
      .then(groups => active && setResults({ search, groups }))
      .catch(() => active && dispatch(notify('error', GENERIC_ERROR)))
    return () => { active = false }
  }, [search, dispatch])

  function renderSearch() {
    if (results.search !== search) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress aria-label="Buscando grupos" />
        </Box>
      )
    }
    if (results.groups.length === 0) {
      return <EmptyState title={`No hay ningún grupo que coincida con «${search}».`}>Revisa el nombre o pide a quien lo creó que te envíe el enlace.</EmptyState>
    }
    return <GroupCards groups={results.groups} />
  }

  function renderOwnGroups() {
    if (!groupsLoaded) {
      return (
        <Stack spacing={1.5} role="status" aria-label="Cargando tus grupos">
          {[0, 1, 2].map(i => <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: '16px' }} />)}
        </Stack>
      )
    }
    if (userGroups.length === 0) {
      return (
        <EmptyState title="Aún no estás en ningún grupo">
          Crea uno con «Crear grupo» o busca el de tu familia o tus amigos para pedir unirte.
        </EmptyState>
      )
    }
    return <GroupCards groups={userGroups} />
  }

  return (
    <Page>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2.5 }}>
        <Typography variant="h1" component="h1">Tus grupos</Typography>
        <NewGroupModal />
      </Stack>
      <SearchField />
      {search !== ''
        ? <Section id="results-title" title="Resultados de la búsqueda">{renderSearch()}</Section>
        : (
          <>
            <Box sx={{ mb: 4 }}>{renderOwnGroups()}</Box>
            {userRequests.length > 0 && (
              <Section id="requests-title" title="Solicitudes pendientes">
                <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>
                  Podrás entrar en estos grupos cuando quien los administra acepte tu solicitud.
                </Typography>
                <GroupCards groups={userRequests} />
              </Section>
            )}
          </>
        )}
    </Page>
  )
}
