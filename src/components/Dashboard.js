import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useSelector, useDispatch } from 'react-redux'
import { setSelectedGroup, toggleShowDashboard } from  '../redux/actions'
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
    dispatch(toggleShowDashboard())
  }

  function getUsers() {
    setUsers([])

    selectedGroup.users.forEach(userId => {
      db.collection('users').doc(userId).get()
      .then(doc => {
        const user = {...doc.data(), uid: userId }
        setUsers(users => [...users, user])
      })
    })
  }
  
  function getRequesters() {
    setRequesters([])

    selectedGroup.requests.forEach(userId => {
      db.collection('users').doc(userId).get()
      .then(doc => {
        const requester = {...doc.data(), uid: userId }
        setRequesters([...requesters, requester])
      })
    })
  }

  useEffect(() => {
    // si ya tenemos los datos del grupo, podemos traer los de sus personas:
    console.log(selectedGroup)
    if (Object.keys(selectedGroup).length > 0) {
      getRequesters()
      getUsers()
    } 
  }, [selectedGroup])

  useEffect(() => {
    console.log(users)
  },[users])

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
