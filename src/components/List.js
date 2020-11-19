import React, {useEffect} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import { Icon } from '@material-ui/core';
import { db } from '../firebase'
import { useSelector } from 'react-redux'
import firebase from 'firebase'

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper,
  },
}));

export default function SimpleList({people, member}) {
  const classes = useStyles();
  const icon = checkMember()
  const selectedGroup = useSelector(state => state.selectedGroup)

  function checkMember() {
    // TODO: primero comprobar si eres admin para ver estas opciones
    if (member) {
      return 'person_remove_alt_1'
    } else {
      return 'person_add_alt_1'
    }
  }

  function handleClick(e) {
    if (member) {
      //borar usuario
      // TODO: comprobar que no seas tú mismo
      if (window.confirm('¿Eliminar a esta persona del grupo?')) {
        // borrar su id de users
        db.collection('groups').doc(selectedGroup.groupName).update({
          users: firebase.firestore.FieldValue.arrayRemove(e.target.id),
        })
        // borrar el nombre de selectedGroup de groups del usuario
        db.collection('users').doc(e.target.id).update({
          groups: firebase.firestore.FieldValue.arrayRemove(selectedGroup.groupName),
        })
      }
    } else {
      // añadir su id a users y quitarlo de requests
      db.collection('groups').doc(selectedGroup.groupName).update({
        users: firebase.firestore.FieldValue.arrayUnion(e.target.id),
        requests: firebase.firestore.FieldValue.arrayRemove(e.target.id)
      })
      // añadir el nombre de selectedGroup a groups del usuario y borrarlo de requests
      db.collection('users').doc(e.target.id).update({
        groups: firebase.firestore.FieldValue.arrayUnion(selectedGroup.groupName),
        requests: firebase.firestore.FieldValue.arrayRemove(selectedGroup.groupName)
      })
    }
  }

  useEffect(() => {
    console.log(people)
  }, [])

  return (
    <div className={classes.root}>
      <List component="nav" aria-label="main mailbox folders">
        { people.map(p => (
            <>
              <ListItem button > 
                <ListItemIcon onClick={handleClick} id={p.uid} >
                  <Icon id={p.uid} >{icon}</Icon>
                </ListItemIcon>
                <ListItemText primary={p.name} secondary={p.email} />
              </ListItem>
              <Divider />
            </>
          )) 
        }
        {/* <ListItem button>
          <ListItemIcon>
            <Icon>person</Icon>
          </ListItemIcon>
          <ListItemText primary={u.name} secondary={u.email} />
        </ListItem>
        <Divider /> */}
      </List>
    </div>
  );
}
