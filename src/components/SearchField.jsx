import { useState } from 'react'
import { useDispatch } from 'react-redux'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Icon from '@mui/material/Icon'
import { setSearch } from '../redux/actions'

export function normalizeSearch(term) {
  return term.trim().replace(/\s+/g, ' ').toLowerCase()
}

export default function SearchField() {
  const [searchTerm, setSearchTerm] = useState('')
  const dispatch = useDispatch()

  function handleChange(e) {
    if (e.target.value === '') dispatch(setSearch(''))
    setSearchTerm(e.target.value)
  }

  function handleSearch(e) {
    e.preventDefault()
    dispatch(setSearch(normalizeSearch(searchTerm)))
  }

  return (
    <form onSubmit={handleSearch} role="search">
      <TextField
        variant="standard"
        sx={{ display: 'block' }}
        id="search-groups"
        placeholder="Buscar grupos"
        type="search"
        autoComplete="off"
        value={searchTerm}
        onChange={handleChange}
        slotProps={{
          htmlInput: { 'aria-label': 'Buscar grupos' },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <Button variant="contained" color="primary" type="submit" aria-label="Buscar">
                  <Icon>search</Icon>
                </Button>
              </InputAdornment>
            ),
          },
        }}
      />
    </form>
  )
}
