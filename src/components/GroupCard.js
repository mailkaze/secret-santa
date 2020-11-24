import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import { red } from '@material-ui/core/colors';
import { Icon } from '@material-ui/core';
import { useSelector, useDispatch } from 'react-redux'
import { setShowDashboard, 
        setSelectedGroup, 
        setSearch, 
        setSnackbar } from '../redux/actions'
import { db } from '../firebase'
import firebase from 'firebase'

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    marginBottom: '5px',
  },
  avatar: {
    backgroundColor: red[500],
  },
}));

export default function GroupCard({groupName}) {
  const classes = useStyles();
  const user = useSelector(state => state.user)
  const member = user.groups.includes(groupName)
  const icon = checkMember()
  const dispatch = useDispatch()

  function handleClick() {
    if (member) {
      console.log(user)
      getGroupData()
      dispatch(setShowDashboard(true))
      dispatch(setSearch(''))
    } else {
      dispatch(setSnackbar({show: true, severity: 'warning', message: 'No eres miembro de este grupo.'}))
    }
  }

  function getGroupData() {
    db.collection('groups').doc(groupName).onSnapshot(doc => {
      dispatch(setSelectedGroup({...doc.data(), groupName: groupName}))
    })
  }

  function checkMember() {
    if (user.groups.includes(groupName)) {
      return 'clear' // eres miembro
    } else {
      if (user.requests.includes(groupName)) {
        return 'how_to_reg' // solicitud enviada
      } else {
        return 'person_add' // no eres miembro
      }
    }
  }

  function handleMembership(e) {
    e.stopPropagation()// previene que se abra el dashboard al pulsar el botón.
    
    const groupReference = db.collection('groups').doc(groupName)
    const userReference = db.collection('users').doc(user.uid)

    if (member) {
      // salir del grupo, si eres admin lo destruye:
      groupReference.get()
      .then(doc => {
        if (doc.data().admin === user.uid) { // eres el administrador, destruir grupo:
          if(window.confirm('Si eliminas el grupo nadie podra acceder a él y se borrarán todos los datos de regalos y sorteos, ¿Deseas eliminar este grupo?')) {
            // recoger la lista de usuarios y eliminar el grupo de todas las listas de cada usuario:
            const members = doc.data().users
            const requesters = doc.data().requests
            members.forEach(async m => {
              await db.collection('users').doc(m).update({
                groups: firebase.firestore.FieldValue.arrayRemove(groupName),
                [`wishes.${groupName}`]: firebase.firestore.FieldValue.delete()
              })
            })
            requesters.forEach(async r => {
              await db.collection('users').doc(r).update({
                requests: firebase.firestore.FieldValue.arrayRemove(groupName)
              })
            })
            // destruir el grupo
            groupReference.delete()
            .then(() => {
              dispatch(setSnackbar({show: true, severity: 'success', message: 'El grupo se ha eliminado con éxito.'}))
            })            
          }
        } else { // no eres administrador y solo sales del grupo:
          if (window.confirm('¿Abandonar este grupo?')) {            
            groupReference.update({users: firebase.firestore.FieldValue.arrayRemove(user.uid)})
            userReference.update({
              groups: firebase.firestore.FieldValue.arrayRemove(groupName),
              [`wishes.${groupName}`]: firebase.firestore.FieldValue.delete()
            })
            dispatch(setSnackbar({show: true, severity: 'info', message: 'Has abandonado este grupo.'}))
            dispatch(setSearch(''))
          }
        }
      })
      
    } else {
      if (user.requests.includes(groupName)) {
        if (window.confirm('¿Cancelar solicitud?')) {
          // cancelar solicitud
          groupReference.update({requests: firebase.firestore.FieldValue.arrayRemove(user.uid)})
          userReference.update({requests: firebase.firestore.FieldValue.arrayRemove(groupName)})
          dispatch(setSnackbar({show: true, severity: 'info', message: 'Has cancelado tu solicitud de ingreso a este grupo.'}))
          dispatch(setSearch(''))
        }
      } else {
        // enviar solicitud
        console.log('Enviando solicitud al grupo', groupName, 'con el usuario', user.uid)
        groupReference.update({requests: firebase.firestore.FieldValue.arrayUnion(user.uid)})
        userReference.update({requests: firebase.firestore.FieldValue.arrayUnion(groupName)})
        dispatch(setSnackbar({show: true, severity: 'info', message: 'Se ha enviado tu solicitud. Cuando se acepte, podrás acceder a este grupo.'}))
        dispatch(setSearch(''))
      }
    }
    
  }

  return (
    <Card className={classes.root} onClick={handleClick}>
      <CardHeader
        avatar={
          <Avatar aria-label="recipe" className={classes.avatar}>
            <Icon>group</Icon>
          </Avatar>
        }
        action={
          <IconButton aria-label="settings"  onClick={handleMembership} >
            <Icon>{icon}</Icon>
          </IconButton>
        }
        title={groupName}
      />
    </Card>
  );
}