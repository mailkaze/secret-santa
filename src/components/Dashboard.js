import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useSelector, useDispatch } from 'react-redux'
import { setSelectedGroup, setShowDashboard, setSnackbar } from  '../redux/actions'
import SimpleList from './List'
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { Icon, Typography } from '@material-ui/core';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import Tooltip from '@material-ui/core/Tooltip';
import Zoom from '@material-ui/core/Zoom';
import { db } from '../firebase'
import firebase from 'firebase/app'
import PresentCard from './presentCard'
import ShuffleModal from './shuffleModal'
import RateCard from './RateCard'

const DashboardStyled = styled.div`
  width: 100%;
  height: 100%;
  position: relative;

  #close-button {
    font-size: 2.4em;
    position: absolute;
    top: 0;
    left: 4px;
    margin-left: 5px;
  }

  h5 {
    margin-top: 10px;
    font-weight: 500;
  }

  #readyButton {
    margin-top: 8px;
  }

  form {
    margin: 20px 0;
  }

  form > button {
    margin: 0 0 0 5px;
    height: 44px;
    margin-top: 0 !important; 
    width: 80px;
  }

  #outlined-helperText {
    margin-top:8px;
    height: .5em;
    padding-top: 10px;
  }

  #gift-image {
    height: 40px;
  }

  #shuffle-text {
    margin-left: 10px;
  }
`

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

export default function Dashboard() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [members, setMembers] = useState([])
  const [requesters, setRequesters] = useState([])
  const [wish, setWish] = useState('¡Cualquier cosa!')
  const [showShuffleModal, setShowShuffleModal] = useState(false)
  const [shuffleNames, setShuffleNames] = useState([])
  const [receiverName, setReceiverName] = useState('')
  const [receiverWish, setReceiverWish] = useState('')
  const selectedGroup = useSelector(state => state.selectedGroup)
  const user = useSelector(state => state.user)
  const snackbar = useSelector(state => state.snackbar)
  const dispatch = useDispatch()
  
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    dispatch(setSnackbar({...snackbar, show: false}))
  };

  function handleClose() {
    dispatch(setSelectedGroup({}))
    dispatch(setShowDashboard(false))
  }

  function getMembers() {
    setMembers([])
    selectedGroup.users.forEach(userId => {
      db.collection('users').doc(userId).get()
      .then(doc => {
        const member = {...doc.data(), uid: userId }
        setMembers(members => [...members, member])
      })
    })
  }
  
  function getRequesters() {
    setRequesters([])
    selectedGroup.requests.forEach(userId => {
      db.collection('users').doc(userId).get()
      .then(querySnapShot => {
        const requester = {...querySnapShot.data(), uid: userId }
        setRequesters(requesters => [...requesters, requester])
      })
    })
  }

  function onDelete() {
    const groupReference = db.collection('groups').doc(selectedGroup.groupName)
    const userReference = db.collection('users').doc(user.uid)
    if (isAdmin) {
      if (window.confirm('Si eliminas el grupo nadie podra acceder a él y se borrarán todos los datos de regalos y sorteos, ¿Deseas eliminar este grupo?')) {
        // eliminar grupo
        // recoger la lista de usuarios y eliminar el grupo de todas las listas de cada usuario:
        const members = selectedGroup.users
        const requesters = selectedGroup.requests
        members.forEach(async m => {
          await db.collection('users').doc(m).update({
            groups: firebase.firestore.FieldValue.arrayRemove(selectedGroup.groupName),
            requests: firebase.firestore.FieldValue.arrayRemove(selectedGroup.groupName),
            [`wishes.${selectedGroup.groupName}`]: firebase.firestore.FieldValue.delete(),
            [`ratings.${selectedGroup.groupName}`]: firebase.firestore.FieldValue.delete()
          })
        })
        requesters.forEach(async r => {
          await db.collection('users').doc(r).update({
            requests: firebase.firestore.FieldValue.arrayRemove(selectedGroup.groupName)
          })
        })
        // destruir el grupo
        groupReference.delete()
        .then(() => {
          dispatch(setSnackbar({show: true, severity: 'success', message: 'El grupo se ha eliminado con éxito.'}))
        })
        dispatch(setShowDashboard(false))
      }
    } else {
      // salir del grupo
      
      if (selectedGroup.shuffleStage === true) {
        dispatch(setSnackbar({show: true, severity: 'error', message: 'No se puede abandonar el grupo durante la fase de sorteo.'}))
      } else {
        if (window.confirm('¿Abandonar este grupo?')) {
          groupReference.update({users: firebase.firestore.FieldValue.arrayRemove(user.uid)})
          userReference.update({
            groups: firebase.firestore.FieldValue.arrayRemove(selectedGroup.groupName),
            [`wishes.${selectedGroup.groupName}`]: firebase.firestore.FieldValue.delete(),
            [`ratings.${selectedGroup.groupName}`]: firebase.firestore.FieldValue.delete()
          })
          dispatch(setSnackbar({show: true, severity: 'info', message: 'Has abandonado este grupo.'}))
          dispatch(setShowDashboard(false))
        }
      }
    }
  }

  function updateWish(e) {
    e.preventDefault()
    db.collection('users').doc(user.uid).update({
      // Para actualizar un dato de tipo objeto Firebase exije que lo escribas "dato.key: cambio" 
      // o si no borra las demás keys. Como la key aquí es dinámica se hace así:
      [`wishes.${selectedGroup.groupName}`]: wish
    })
    .then(() => {
      dispatch(setSnackbar({show: true, severity: 'success', message: 'Tu nuevo regalo ideal se ha guardado correctamente.'}))
    })
  }

  function handleChange(e) {
    setWish(e.target.value)
  }

  function onReady() {
    if (selectedGroup.users.length > 1) {
      if (window.confirm('Al entrar en la etapa de sorteo los miembros verán el botón SORTEAR y ya no se podrán añadir o borrar miembros. ¿Iniciar etapa de sorteo?')) {
        
        shuffle() // el sorteo es justo y aleatorio pero debe hacerse en esta etapa para evitar errores
        
        db.collection('groups').doc(selectedGroup.groupName).update({
          shuffleStage: true
        })
        .then(() => {
          dispatch(setSnackbar({show: true, severity: 'success', message: 'Etapa de sorteo, ¡ahora los miembros de este grupo pueden pulsar el botón sortear para ver a quién les toca regalar!'}))
        })
      }
    } else {
      dispatch(setSnackbar({show: true, severity: 'error', message: 'Se necesitan al menos dos miembros en el grupo para poder sortear.'}))
    }
  }

  function shuffle() {
    const givers = selectedGroup.users
    let receivers = [...givers] // receivers es una copia de givers
    receivers.sort(() => Math.random() - 0.5)
    const giversReceivers = {}
    givers.forEach((key, i) => giversReceivers[key] = receivers[i])
    console.log('Objeto giversReceivers sorteado:',giversReceivers)
    let perfectShuffle = true
    for (const key in giversReceivers) {
      if (key === giversReceivers[key]) {
        perfectShuffle = false
      }
    }
    if (perfectShuffle) {
      console.log('todo salió perfecto, lo escribimos en la DB')
      db.collection('groups').doc(selectedGroup.groupName).update({ giversReceivers: giversReceivers})
    } else {
      console.log('No se sorteó bien, repetimos')
      shuffle()
    }
  }

  function illusion() {
    // añadir uid a shufflers
    db.collection('groups').doc(selectedGroup.groupName).update({
      shufflers: firebase.firestore.FieldValue.arrayUnion(user.uid)
    })
    // animacion
    setShuffleNames([])
    selectedGroup.users.forEach(m => {
      db.collection('users').doc(m).get()
      .then(doc => {
        setShuffleNames(shuffleNames => [...shuffleNames, doc.data().name])
      })
    })
  }

  function resetShuffle() {
    // reset los wish y los ratigns de los usuarios del grupo
    if (window.confirm('¿Quieres borrar todos los datos de este intercambio de regalos para empezar uno nuevo? No se borrarán los miembros del grupo ni las solicitudes de ingreso')) {
      selectedGroup.users.forEach(u => {
        db.collection('users').doc(u).update({
          [`wishes.${selectedGroup.groupName}`]: "¡Cualquier cosa!",
          [`ratings.${selectedGroup.groupName}`]: firebase.firestore.FieldValue.delete()
        })
      })
      db.collection('groups').doc(selectedGroup.groupName).update({ shuffleStage: false, giversReceivers: {}, shufflers: [] })
      .then(() => {
        dispatch(setSnackbar({show: true, severity: 'info', message: 'El grupo se ha reinicido para realizar un nuevo sorteo.'}))
      })
    }
  }

  function getReceiverData() {
    if (selectedGroup.shuffleStage) {
      if (selectedGroup.shufflers.includes(user.uid)) {
        console.log('este usuario ya sorteó y podemos mostrar a quien regala')
        const receiver = selectedGroup.giversReceivers[user.uid]
        db.collection('users').doc(receiver).get()
        .then((doc) => {
          setReceiverName(doc.data().name)
          setReceiverWish(doc.data().wishes[selectedGroup.groupName])
        })
      }
    }
  }

  useEffect(() => {
    // si ya tenemos los datos del grupo, podemos traer los de sus personas:
    console.log('SELECTED-GROUP:', selectedGroup.groupName)
    if (Object.keys(selectedGroup).length > 0) {
      setWish(user.wishes[selectedGroup.groupName])
      setIsAdmin(selectedGroup.admin === user.uid)
      getMembers()
      getRequesters()
      getReceiverData()
      if (!selectedGroup.users.includes(user.uid)) {
        dispatch(setShowDashboard(false))
      }
    } 
  }, [selectedGroup])

  useEffect(() => {
    return () => { // al desmontar el componente:
      dispatch(setSelectedGroup({}))
      dispatch(setShowDashboard(false))
    }
  }, [])

  useEffect(() => {
    if (shuffleNames.length > 0) {
      setShowShuffleModal(true)
    }
  },[shuffleNames])

  return (
    <DashboardStyled>
      <Tooltip 
        placement="top" 
        TransitionComponent={Zoom} 
        disableFocusListener 
        title="Volver a la lista de grupos" 
        arrow>
        <Icon onClick={handleClose} id="close-button" >arrow_back</Icon>
      </Tooltip>
      <Typography variant="h5" >{selectedGroup.groupName}</Typography>
      
      {isAdmin && <Typography variant="body2">Eres el administrador de este grupo.</Typography>}
      { isAdmin 
        ? (!selectedGroup.shuffleStage && <Button variant="contained" color="primary" id="readyButton" onClick={onReady} >
            Listo para sorteo
          </Button>)
        : (!selectedGroup.shuffleStage && <Typography variant="body2">Esperando a que se complete el grupo...</Typography>)
      }
      <form onSubmit={updateWish} >
        <TextField
          id="outlined-helperText"
          label="¿Qué quieres que te regalen?"
          value={wish}
          onChange={handleChange}
          variant="outlined"
        />
        <Button variant="contained" color="primary" id="readyButton" type="submit">Guardar</Button>
      </form>
      {
        selectedGroup.shuffleStage &&
          (!selectedGroup.shufflers.includes(user.uid)
          ? (<Button variant="contained" color="secondary" id="readyButton" size="large" onClick={illusion} >
              <img src="/caja-de-regalo.svg" id="gift-image" alt="gift" /><span id="shuffle-text">SORTEAR</span>
            </Button>)
          : (<div>
              <PresentCard name={receiverName} wish={receiverWish} />
              <RateCard />
            </div>))
      }
      {showShuffleModal && <ShuffleModal show={showShuffleModal} setShow={setShowShuffleModal} names={shuffleNames} receiver={receiverName} />}
      <div className="members">
        <Typography variant="button" >Miembros de este grupo:</Typography>
        { members.length > 0 && <SimpleList people={members} member={true} isAdmin={isAdmin} />}
      </div>

      { requesters.length > 0 && isAdmin && !selectedGroup.shuffleStage &&
        <div className="requests">
          <h4>Solicitudes para unirse:</h4>
          { <SimpleList people={requesters} member={false} isAdmin={isAdmin} />}
        </div>
      }
      {isAdmin && 
      <Button 
        variant="contained"
        color="secondary" 
        onClick={resetShuffle}>
          Reiniciar sorteo
      </Button>}
      <br />
      <br />
      <Button
        variant="contained"
        color="secondary"
        startIcon={<Icon>{ isAdmin ? 'delete' : 'clear'}</Icon>}
        onClick={onDelete}
      >
        { isAdmin ? 'eliminar grupo' : 'abandonar grupo'}
      </Button>
      <Snackbar open={snackbar.show} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </DashboardStyled>
  )
}
