import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useSelector, useDispatch } from 'react-redux'
import { setSelectedGroup, setShowDashboard } from  '../redux/actions'
import SimpleList from './List'
import Button from '@material-ui/core/Button';
import { Icon } from '@material-ui/core';
import { db } from '../firebase'


const DashboardStyled = styled.div`
  width: 100%;
  height: 100%;

  #readyButton {
    margin-top: 8px;
  }
`

export default function Dashboard() {
  const [users, setUsers] = useState([])
  const [requesters, setRequesters] = useState([])
  const selectedGroup = useSelector(state => state.selectedGroup)
  const dispatch = useDispatch()

  function handleClose() {
    dispatch(setSelectedGroup({}))
    dispatch(setShowDashboard(false))
  }

  function getUsers() {
    setUsers([])

    selectedGroup.users.forEach(userId => {
      db.collection('users').doc(userId).onSnapshot(doc => {
        const user = {...doc.data(), uid: userId }
        setUsers(users => [...users, user])
      })
    })
  }
  
  function getRequesters() {
    setRequesters([])

    selectedGroup.requests.forEach(userId => {
      db.collection('users').doc(userId).onSnapshot(doc => {
        const requester = {...doc.data(), uid: userId }
        setRequesters(requesters => [...requesters, requester])
      })
    })
  }

  useEffect(() => {
  },[users, requesters])

  useEffect(() => {
    // si ya tenemos los datos del grupo, podemos traer los de sus personas:
    console.log(selectedGroup)
    if (Object.keys(selectedGroup).length > 0) {
      getRequesters()
      getUsers()
    } 
  }, [selectedGroup])

  useEffect(() => {
    return () => { // al desmontar el componente:
      dispatch(setShowDashboard(false))
    }
  }, [])

  return (
    <DashboardStyled>
      <Icon onClick={handleClose} >close</Icon>
      <h2>Grupo {selectedGroup.groupName}</h2>
      <Button variant="contained" color="primary" id="readyButton">
        Listo para sorteo
      </Button>
      <Button variant="contained" color="secondary" id="readyButton" size="large">
        🎁 SORTEAR
      </Button>
      
      <div className="members">
        <h4>Miembros de este grupo:</h4>
        { users.length > 0 && <SimpleList people={users} member={true} />}
      </div>

      { requesters.length > 0 && //TODO: solo ver si eres admin
        <div className="requests">
          <h4>Solicitudes para unirse:</h4>
          { <SimpleList people={requesters} member={false} />}
        </div>
      }

      <Button
        variant="contained"
        color="secondary"
        startIcon={<Icon>delete</Icon>}
      >
        eliminar grupo
      </Button>
      
    </DashboardStyled>
  )
}
