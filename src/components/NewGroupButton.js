import React from 'react';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import Icon from '@material-ui/core/Icon';

const useStyles = makeStyles((theme) => ({
  button: {
    margin: theme.spacing(1),
  },
}));

export default function NewGroupButton() {
  const classes = useStyles();

  return (
    <Button
      variant="contained"
      color="primary"
      className={classes.button}
      startIcon={<Icon>add</Icon>}
    >
      Crear grupo
    </Button>  
  );
}