import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import NewGroupButton from './NewGroupButton';
import { db } from '../firebase'
import { useSelector, useDispatch } from 'react-redux'
import { setSnackbar } from '../redux/actions'
import firebase from 'firebase'

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
  const [groupName, setGroupName] = React.useState('')
  const user = useSelector(state => state.user)
  const dispatch = useDispatch()

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  function handleChange(e) {
    setGroupName(e.target.value)
  }

  function handleCreate(e) {
    e.preventDefault()

    const groupRef = db.collection('groups').doc(groupName)

    groupRef.get()
    .then((docSnapshot) => {
      if (!docSnapshot.exists) {
        // si el grupo no existe:
        const newGroup = {
          admin: user.uid,
          users: [user.uid],
          requests: [],
          giversReceivers: {},
          created: Date.now(),
          shuffleStage: false,
          shufflers: []
        }
        // Creamos el grupo
        groupRef.set(newGroup)
        .catch(error => {
          console.log(error)
        })

        //guardamos el id del grupo en el array de grupos del usuario:
        db.collection('users').doc(user.uid).update({
          groups: firebase.firestore.FieldValue.arrayUnion(groupName),
          [`wishes.${groupName}`]: '¡Cualquier cosa!'
        })
        .then(() => {
          dispatch(setSnackbar({show: true, severity: 'success', message: 'Nuevo grupo creado con éxito.'}))
          setGroupName('')
          handleClose()
        })
        .catch(error => {
          console.log(error)
        })
      } else {
        dispatch(setSnackbar({show: true, severity: 'error', message: 'Ya existe un grupo con ese nombre.'}))
        setGroupName('')
      }
    })
  }

  const body = (
    <div className={classes.paper}>
      <form className={classes.root} autoComplete="off" style={{margin: 'auto'}} onSubmit={handleCreate} >
        <TextField 
          id="standard-basic" 
          label="Nombre del grupo" 
          className={classes.input} 
          onChange={handleChange} 
          value={groupName}
          required
          autoFocus
        />
        <Button 
          type="submit"
          variant="contained" 
          color="primary" 
          style={{margin: 'auto'}}
        >
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