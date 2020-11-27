import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useSelector, useDispatch } from 'react-redux'
import { setSelectedGroup, setShowDashboard, setSnackbar } from  '../redux/actions'
import SimpleList from './List'
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { Icon } from '@material-ui/core';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import { db } from '../firebase'
import firebase from 'firebase'

const DashboardStyled = styled.div`
  width: 100%;
  height: 100%;

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
`

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

export default function Dashboard() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [members, setMembers] = useState([])
  const [requesters, setRequesters] = useState([])
  const [wish, setWish] = useState('¡Cualquier cosa!')
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
            [`wishes.${selectedGroup.groupName}`]: firebase.firestore.FieldValue.delete()
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
      if (window.confirm('¿Abandonar de este grupo?')) {
        groupReference.update({users: firebase.firestore.FieldValue.arrayRemove(user.uid)})
        userReference.update({
          groups: firebase.firestore.FieldValue.arrayRemove(selectedGroup.groupName),
          [`wishes.${selectedGroup.groupName}`]: firebase.firestore.FieldValue.delete()
        })
        dispatch(setSnackbar({show: true, severity: 'info', message: 'Has abandonado este grupo.'}))
        dispatch(setShowDashboard(false))
      }
    }
  }

  function updateWish(e) {
    e.preventDefault()
    db.collection('users').doc(user.uid).update({
      // Para actualizar un dato de tipo objeto Firebase exije que lo escribas "dato.key: cambio" 
      // o si no borra las demás keys. Como la key aquí es dinámica tuve que hacer esta rareza para que funcione:
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
    if (window.confirm('Al entrar en la etapa de sorteo los miembros verán por turnos el botón SORTEO y ya no se podrán añadir o borrar miembros. ¿Iniciar etapa de sorteo?')) {
      
      draw() // el sorteo es justo y aleatorio pero debe hacerse en esta etapa para evitar errores

      db.collection('groups').doc(selectedGroup.groupName).update({
        drawStage: true
      })
      .then(() => {
        dispatch(setSnackbar({show: true, severity: 'success', message: 'El grupo ha entrado en etapa de sorteo. Sólo un miebro a la vez podrá sortear y será en el orden en que fueron añadidos.'}))
      })
    }
  }

  function showDrawButton() {
    if (selectedGroup.drawStage) {
      if (!Object.keys(selectedGroup.giversReceivers).find(giver => giver === user.uid)) {
        console.log('aun no regalas a nadie')
        return true
      }
      console.log('ya sorteaste')
    }
    return false
  }

  function draw() {
    // const receivers = Object.values(selectedGroup.giversReceivers)
    // console.log(receivers)
    // const candidates = selectedGroup.users.filter(u => u !== user.uid && !receivers.includes(u))
    // // miembros que no sea yo ni estén como valores en giversreceivers
    // const randomSize = candidates.length
    // const result = Math.floor(Math.random() * randomSize)
    // console.log('Le regalas a la posición:', result, 'con UID:', candidates[result])
    // db.collection('groups').doc(selectedGroup.groupName).update({
    //   [`giversReceivers.${user.uid}`]: candidates[result]
    // })
    const givers = selectedGroup.users
    let receivers = [...givers]
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
      draw()
    }
  }

  function illusion() {
    console.log('le regalas a...')
  }

  function resetDraw() {
    db.collection('groups').doc(selectedGroup.groupName).update({ drawStage: false, giversReceivers: {} })
  }

  useEffect(() => {
    // si ya tenemos los datos del grupo, podemos traer los de sus personas:
    console.log('SELECTED-GROUP:', selectedGroup.groupName)
    if (Object.keys(selectedGroup).length > 0) {
      setWish(user.wishes[selectedGroup.groupName])
      setIsAdmin(selectedGroup.admin === user.uid)
      getMembers()
      getRequesters()
    } 
  }, [selectedGroup])

  useEffect(() => {
    return () => { // al desmontar el componente:
      dispatch(setSelectedGroup({}))
      dispatch(setShowDashboard(false))
    }
  }, [])

  return (
    <DashboardStyled>
      <Icon onClick={handleClose} >close</Icon>
      <h2>Grupo {selectedGroup.groupName}</h2>
      {isAdmin && <p>Eres el administrador de este grupo.</p>}
      { isAdmin 
        ? (!selectedGroup.drawStage && <Button variant="contained" color="primary" id="readyButton" onClick={onReady} >
            Listo para sorteo
          </Button>)
        : <p>Esperando a que se complete el grupo...</p>
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
      {showDrawButton() && 
        <Button variant="contained" color="secondary" id="readyButton" size="large" onClick={illusion} >
          🎁 SORTEAR
        </Button>
      }
      <button onClick={resetDraw}>RESET</button>
      
      <div className="members">
        <h4>Miembros de este grupo:</h4>
        { members.length > 0 && <SimpleList people={members} member={true} isAdmin={isAdmin} />}
      </div>

      { requesters.length > 0 && isAdmin &&
        <div className="requests">
          <h4>Solicitudes para unirse:</h4>
          { <SimpleList people={requesters} member={false} isAdmin={isAdmin} />}
        </div>
      }

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
