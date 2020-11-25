import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '@material-ui/core/TextField';
import { Icon } from '@material-ui/core';
import { useDispatch } from 'react-redux'
import { setSearch } from '../redux/actions'

const useStyles = makeStyles((theme) => ({
  margin: {
    margin: theme.spacing(1),
    display: 'block',
  },
}));

export default function SearchField() {
  const classes = useStyles();
  const [searchTerm, setSearchTerm] = useState('')
  const dispatch = useDispatch()

  function handleChange(e) {
    setSearchTerm(e.target.value)
  }

  function handleSearch(e) {
    e.preventDefault()
    dispatch(setSearch(searchTerm.toLowerCase()))
  }

  function handleReset() {
    setSearchTerm('')
    dispatch(setSearch(''))
  }

  return (
    <form onSubmit={handleSearch} >
      <TextField
        className={classes.margin}
        id="input-with-icon-textfield"
        placeholder="Buscar grupos"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" onClick={handleSearch}>
              <Icon>search</Icon>
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end" onClick={handleReset}>
              <Icon>close</Icon>
            </InputAdornment>
          )
        }}
        value={searchTerm}
        onChange={handleChange}
      />
    </form>
    
  );
}