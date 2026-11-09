import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'
import GroupCard from './GroupCard'
import SearchField from './SearchField'
import NewGroupModal from './NewGroupModal'
import { searchGroups } from '../services'
import { notify } from '../redux/actions'
import { GENERIC_ERROR } from '../utils'

const StyledGroupsList = styled('div')`
  background-color: #edf2f4;
  height: 100vh;
  padding-top: 8px;
`

export default function GroupsList() {
  const userGroups = useSelector(state => state.userGroups)
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

  const groups = search === '' ? userGroups : (results.search === search ? results.groups : [])

  return (
    <StyledGroupsList>
      <SearchField />
      <Box sx={{ m: 'auto', maxWidth: '500px', width: '96%' }}>
        <h4>Grupos:</h4>
        {groups.map(group => <GroupCard group={group} key={group.id} />)}
      </Box>
      <NewGroupModal />
    </StyledGroupsList>
  )
}
