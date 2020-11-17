import React, { useState, useEffect } from 'react'
import GroupCard from './GroupCard'
import SearchField from './SearchField'
import { makeStyles } from '@material-ui/core/styles';
import NewGroupModal from './NewGroupModal';
import { db } from '../firebase';
import { useSelector } from 'react-redux'

const useStyles = makeStyles((theme) => ({
  list: {
    margin: 'auto',
    maxWidth: '500px',
    width: '96%',
  },
}));

export default function GroupsList() {
  const classes = useStyles();
  const [groupNames, setGroupNames] = useState([])
  const user = useSelector(state => state.user)
  const search = useSelector(state => state.search)

  function getGroups() {
    setGroupNames([])

    if (search === '') { // No se está buscando nada, traemos la lista de nombres de grupos de los datos de usuario
      db.collection('users').doc(user.uid).get()
      .then(doc => {
        const groupIds = doc.data().groups
        setGroupNames(groupIds)
      })
    } else { // hay búsqueda, traemos las coincidencias
      db.collection('groups').get()
      .then(querySnapShot => {
        querySnapShot.forEach(doc => {
          if (doc.id.toLowerCase().includes(search)) {
            setGroupNames(groupNames => [...groupNames, doc.id])
          }
        })
      })
    }
  }  
  
  useEffect(() => {
    getGroups()
  }, [])

  useEffect(() => {
    getGroups()
  }, [search])

  return (
    <div>
      <SearchField />
      <NewGroupModal />
      <div className={classes.list}>
        <p>Grupos a los que perteneces:</p>
        {groupNames.map(g => <GroupCard groupName={g} key={g}/>)}
      </div>
    </div>
  )
}
