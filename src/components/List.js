import React, { useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import Tooltip from '@material-ui/core/Tooltip';
import Zoom from '@material-ui/core/Zoom';
import { Icon } from '@material-ui/core';
import { db } from '../firebase'
import { useSelector, useDispatch } from 'react-redux'
import { setSnackbar } from '../redux/actions'
import firebase from 'firebase'

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper,
  },
}));

export default function SimpleList({people, member, isAdmin}) {
  const classes = useStyles();
  const button = checkMember()
  const selectedGroup = useSelector(state => state.selectedGroup)  
  const user = useSelector(state => state.user)
  const dispatch = useDispatch()

  function checkMember() {
    if (isAdmin) {
      if (member) {
        return 'person_remove_alt_1'
      } else {
        return 'person_add_alt_1'
      }
    }
    return 'person'
  }

  function checkShuffler(person) {
    if (selectedGroup.shuffleStage) {
      if (selectedGroup.shufflers.includes(person.uid)){
        return 'done'
      }
    }
  }

  function checkReceiver(person) {
    if (selectedGroup.giversReceivers[user.uid] === person.uid) {
      return 'card_giftcard'
    }
  }

  function handleClick(e) {
    const groupName = selectedGroup.groupName
    if (isAdmin) {
      if (member) {
        //borar usuario
        // TODO: comprobar que no seas tú mismo
        if (window.confirm('¿Eliminar a esta persona del grupo?')) {
          // borrar su id de users
          db.collection('groups').doc(groupName).update({
            users: firebase.firestore.FieldValue.arrayRemove(e.target.id),
          })
          // borrar el nombre de selectedGroup de groups del usuario
          db.collection('users').doc(e.target.id).update({
            groups: firebase.firestore.FieldValue.arrayRemove(groupName),
          })
          dispatch(setSnackbar({show: true, severity: 'success', message: 'Usuario expulsado con éxito.'}))
        }
      } else {
        // añadir su id a users y quitarlo de requests
        db.collection('groups').doc(groupName).update({
          users: firebase.firestore.FieldValue.arrayUnion(e.target.id),
          requests: firebase.firestore.FieldValue.arrayRemove(e.target.id)
        })
        // añadir el nombre de selectedGroup a groups del usuario y borrarlo de requests
        db.collection('users').doc(e.target.id).update({
          groups: firebase.firestore.FieldValue.arrayUnion(groupName),
          requests: firebase.firestore.FieldValue.arrayRemove(groupName),
          [`wishes.${groupName}`]: '¡Cualquier cosa!'
        })
        dispatch(setSnackbar({show: true, severity: 'success', message: 'Has añadido un nuevo miembro a tu grupo.'}))
      }
    }
  }

  return (
    <div className={classes.root} key={member ? 'members' : 'requesters'}>
      <List component="nav" aria-label="main mailbox folders">
        { people.map(p => (
            <>
              <ListItem key={p.uid} > 
                <ListItemIcon>
                  { selectedGroup.admin === p.uid 
                    ? <Icon>admin_panel_settings</Icon>
                    : <Icon onClick={handleClick} id={p.uid} >{button}</Icon>
                  }
                </ListItemIcon>
                <ListItemText primary={p.name} secondary={p.email} />
                {true && (
                  <Tooltip 
                    placement="top" 
                    TransitionComponent={Zoom} 
                    disableFocusListener 
                    title="Esta persona ya sorteó" 
                    arrow>
                    <Icon>{checkShuffler(p)}</Icon>
                  </Tooltip>
                )}
                {true && (
                  <Tooltip 
                    placement="top" 
                    TransitionComponent={Zoom} 
                    disableFocusListener 
                    title="¡Tú le regalas a esta persona!" 
                    arrow>
                    <Icon>{checkReceiver(p)}</Icon>
                  </Tooltip>
                )}
              </ListItem>
              <Divider />
            </>
          )) 
        }
      </List>
    </div>
  );
}
