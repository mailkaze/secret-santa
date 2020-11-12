import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import InputAdornment from '@material-ui/core/InputAdornment';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import AccountCircle from '@material-ui/icons/AccountCircle';
import { Icon } from '@material-ui/core';
import { Block } from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  margin: {
    margin: theme.spacing(1),
    display: 'block',
  },
}));

export default function SearchField() {
  const classes = useStyles();

  return (
    <TextField
      className={classes.margin}
      id="input-with-icon-textfield"
      placeholder="Buscar grupos"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Icon>search</Icon>
          </InputAdornment>
        ),
      }}
    />
  );
}