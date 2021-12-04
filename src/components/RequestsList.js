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

export default function RequestsList({isAdmin}) {
  const classes = useStyles();

  const [requests, setRequests] = useState([])
  const selectedGroup = useSelector(state => state.selectedGroup)  
  const user = useSelector(state => state.user)
  
  const dispatch = useDispatch()

  async function getRequests() {
    // vaciamos la lista para que no se repitan
    setRequests([])
    let tempRequests = []
    for (let userID of selectedGroup.requests) {
      const doc = await db.collection('users').doc(userID).get()
      tempRequests.push({...doc.data(), uid: userID}) 
    }
    setRequests(tempRequests)
  }

  function handleClick(targetUid) {
    const groupName = selectedGroup.groupName
    if (isAdmin && !selectedGroup.shuffleStage) {
      // añadir su id a users y quitarlo de requests
      db.collection('groups').doc(groupName).update({
        users: firebase.firestore.FieldValue.arrayUnion(targetUid),
        requests: firebase.firestore.FieldValue.arrayRemove(targetUid)
      })
      // añadir el nombre de selectedGroup a groups del usuario y borrarlo de requests
      db.collection('users').doc(targetUid).update({
        groups: firebase.firestore.FieldValue.arrayUnion(groupName),
        requests: firebase.firestore.FieldValue.arrayRemove(groupName),
        [`wishes.${groupName}`]: '¡Cualquier cosa!'
      })
      dispatch(setSnackbar({show: true, severity: 'success', message: 'Has añadido un nuevo miembro a tu grupo.'}))
    }
  }

  useEffect(() => {
    // comprobamos que selectedGroup ya está cargado
    if (Object.keys(selectedGroup).length > 0) {
      getRequests()
    }
  }, [selectedGroup])

  return (
    <div className={classes.root} key='requesters'>
      <List component="nav" aria-label="main mailbox folders">
        { requests.map(p => (
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
                            title="Incluir a esta persona en el grupo" 
                            arrow>
                            <Icon onClick={() => handleClick(p.uid)} >person_add_alt_1</Icon>
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
              <Divider/>
            </div>
          )) 
        }
      </List>
    </div>
  );
}