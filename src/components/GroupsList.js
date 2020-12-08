import React, { useState, useEffect } from 'react'
import GroupCard from './GroupCard'
import SearchField from './SearchField'
import { makeStyles } from '@material-ui/core/styles';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import NewGroupModal from './NewGroupModal';
import { db } from '../firebase';
import { useSelector, useDispatch } from 'react-redux'
import { setUser, setSnackbar } from '../redux/actions'
import styled from 'styled-components'

const StyledGroupsList = styled.div`
  background-color: #edf2f4;
  height: 100vh;
  padding-top: 8px;
`

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

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
  const snackbar = useSelector(state => state.snackbar)
  const dispatch = useDispatch()

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    dispatch(setSnackbar({...snackbar, show: false}))
  };

  function getUserData() {
    // hacemos una escucha a la db para que se actualice la lista al realizar cambios:
    db.collection('users').doc(user.uid).onSnapshot(doc => {
      dispatch(setUser({...doc.data(), uid: doc.id}))
    })    
}

  function getGroups() {
    setGroupNames([])
    getUserData() 
    if (search !== '') {
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
  }, [search])
  
  useEffect(() => {
    getGroups()
  }, [])

  return (
    <StyledGroupsList>
      <SearchField />
      <div className={classes.list}>
        <h4>Grupos:</h4>
        {user !== null && 
          (
            search === ''
            ? user.groups.map(g => <GroupCard groupName={g} key={g} />)
            : groupNames.map(g => <GroupCard groupName={g} key={g} />)
          )
          
        }
      </div>
      <NewGroupModal />
      <Snackbar open={snackbar.show} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </StyledGroupsList>
  )
}
