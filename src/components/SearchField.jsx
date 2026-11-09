import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import SearchIcon from '@mui/icons-material/Search'
import { setSearch } from '../redux/actions'
import { normalizeSearch } from '../utils'

export default function SearchField() {
  const search = useSelector(state => state.search)
  const [searchTerm, setSearchTerm] = useState(search)
  const [previousSearch, setPreviousSearch] = useState(search)
  const dispatch = useDispatch()

  // Si la búsqueda se reinicia desde fuera (por ejemplo, al enviar una solicitud), la caja se vacía
  if (search !== previousSearch) {
    setPreviousSearch(search)
    if (search === '') setSearchTerm('')
  }

  function handleChange(e) {
    if (e.target.value === '') dispatch(setSearch(''))
    setSearchTerm(e.target.value)
  }

  function handleSearch(e) {
    e.preventDefault()
    dispatch(setSearch(normalizeSearch(searchTerm)))
  }

  return (
    <Box component="form" role="search" onSubmit={handleSearch} sx={{ mb: 3 }}>
      <TextField
        id="search-groups"
        placeholder="Busca un grupo"
        type="search"
        autoComplete="off"
        value={searchTerm}
        onChange={handleChange}
        slotProps={{
          htmlInput: { 'aria-label': 'Buscar grupos', enterKeyHint: 'search' },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Button type="submit" variant="contained" size="small">Buscar</Button>
              </InputAdornment>
            ),
          },
        }}
      />
    </Box>
  )
}
