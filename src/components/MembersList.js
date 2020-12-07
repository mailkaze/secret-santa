import React, { useState, useEffect } from 'react';
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

export default function MembersList({isAdmin}) {
  const classes = useStyles();

  const [members, setMembers] = useState([])
  const selectedGroup = useSelector(state => state.selectedGroup)  
  const user = useSelector(state => state.user)
  
  const dispatch = useDispatch()

  function getMembers() {
    // vaciamos la lista para que no se repitan
    setMembers([])
    // for (let userID of selectedGroup.users) {
    //   const doc = await db.collection('users').doc(userID).get()
    //   setMembers(members => [...members, {...doc.data(), uid: userID}])
    // }
    selectedGroup.users.forEach(async userID => {
      const doc = await db.collection('users').doc(userID).get()
      setMembers(members => [...members, {...doc.data(), uid: userID}])
    })
 }

  function handleClick(targetUid) {
    const groupName = selectedGroup.groupName
    if (isAdmin && !selectedGroup.shuffleStage) {
      //borar usuario
      if (window.confirm('¿Eliminar a esta persona del grupo?')) {
        // borrar su id de users
        db.collection('groups').doc(groupName).update({
          users: firebase.firestore.FieldValue.arrayRemove(targetUid),
        })
        // borrar el nombre de selectedGroup de groups del usuario
        db.collection('users').doc(targetUid).update({
          groups: firebase.firestore.FieldValue.arrayRemove(groupName),
        })
        dispatch(setSnackbar({show: true, severity: 'success', message: 'Usuario expulsado con éxito.'}))
      }
    }
  }

  useEffect(() => {
    // comprobamos que selectedGroup ya está cargado
    if (Object.keys(selectedGroup).length > 0) {
      getMembers()
    }
  }, [selectedGroup])

  return (
    <div className={classes.root} key='members'>
      <List component="nav" aria-label="main mailbox folders">
        { members.map(p => (
            <div key={p.uid}>
              <ListItem > 
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
                      ? (
                          <Tooltip 
                            placement="top" 
                            TransitionComponent={Zoom} 
                            disableFocusListener 
                            title="Expulsar miembro" 
                            arrow>
                            <Icon onClick={() => handleClick(p.uid)} >person_remove_alt_1</Icon>
                          </Tooltip>
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
            </div>
          )) 
        }
      </List>
    </div>
  );
}