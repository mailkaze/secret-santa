import React from 'react';
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
import firebase from 'firebase/app'

const useStyles = makeStyles((theme) => ({
  root: {
    width: '90%',
    margin: "auto",
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper,
  },
}));

export default function SimpleList({people, member, isAdmin}) {
  const classes = useStyles();
  const selectedGroup = useSelector(state => state.selectedGroup)  
  const user = useSelector(state => state.user)
  const dispatch = useDispatch()

  function handleClick(e) {
    const groupName = selectedGroup.groupName
    if (isAdmin && !selectedGroup.shuffleStage) {
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
        // para testing con Hassán:
        console.log('e.target.id del requester:', e.target.id)
        console.log('Qué elemento disparó el click:', e.target)
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
                    ? (
                      <Tooltip 
                        placement="top" 
                        TransitionComponent={Zoom} 
                        disableFocusListener 
                        title="Administrador del grupo" 
                        arrow>
                        <Icon>admin_panel_settings</Icon>
                      </Tooltip>
                      )
                    : isAdmin && !selectedGroup.shuffleStage
                      ? ( member 
                        ? (
                          <Tooltip 
                            placement="top" 
                            TransitionComponent={Zoom} 
                            disableFocusListener 
                            title="Expulsar miembro" 
                            arrow>
                            <Icon onClick={handleClick} id={p.uid} >person_remove_alt_1</Icon>
                          </Tooltip>
                        )
                        : (
                          <Tooltip 
                            placement="top" 
                            TransitionComponent={Zoom} 
                            disableFocusListener 
                            title="Incluir a esta persona en el grupo" 
                            arrow>
                            <Icon onClick={handleClick} id={p.uid} >person_add_alt_1</Icon>
                          </Tooltip>  
                        )
                      )
                      : (
                        <Icon onClick={handleClick} id={p.uid} >person</Icon>
                      )
                  }
                </ListItemIcon>
                <ListItemText primary={p.name} secondary={p.email} />
                {selectedGroup.shufflers.includes(user.uid) &&
                 selectedGroup.giversReceivers[user.uid] === p.uid && (
                  <Tooltip 
                    placement="top" 
                    TransitionComponent={Zoom} 
                    disableFocusListener 
                    title="¡Tú le regalas a esta persona!" 
                    arrow>
                    <Icon>card_giftcard</Icon>
                  </Tooltip>
                )}
                { selectedGroup.shufflers.includes(p.uid) && (
                  <Tooltip 
                    placement="top" 
                    TransitionComponent={Zoom} 
                    disableFocusListener 
                    title="Esta persona ya sorteó" 
                    arrow>
                    <Icon>done</Icon>
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
