import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import NewGroupButton from './NewGroupButton';

const useStyles = makeStyles((theme) => ({
  paper: {
    position: 'absolute',
    left: '5%',
    right: '5%',
    top: '30%',
    width: 'auto',
    maxWidth: '500px',
    margin: 'auto',
    backgroundColor: theme.palette.background.paper,
    borderRadius: '3px',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 2, 2),
  },
  input: {
    display: 'block',
    marginBottom: '8px',
    width: '90%',
  }
}));

export default function NewGroupModal() {
  const classes = useStyles();
  // getModalStyle is not a pure function, we roll the style only on the first render
  const [open, setOpen] = React.useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const body = (
    <div className={classes.paper}>
      <form className={classes.root} noValidate autoComplete="off" style={{margin: 'auto'}} >
        <TextField id="standard-basic" label="Nombre del grupo" className={classes.input} />
        <Button variant="contained" color="primary" style={{margin: 'auto'}} >
          Crear Grupo
        </Button>
      </form>
    </div>
  );

  return (
    <div>
      <div onClick={handleOpen}>
        <NewGroupButton />
      </div>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
      >
        {body}
      </Modal>
    </div>
  );
}