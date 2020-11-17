import React, { useEffect } from 'react'
import styled from 'styled-components'
import { useSelector, useDispatch } from 'react-redux'
import { setSelectedGroup, toggleShowDashboard } from  '../redux/actions'


const DashboardStyled = styled.div`
  width: 100%;
  height: 100%;
`

export default function Dashboard() {
  const selectedGroup = useSelector(state => state.selectedGroup)
  const dispatch = useDispatch()

  function handleClose() {
    dispatch(setSelectedGroup({}))
    dispatch(toggleShowDashboard())
  }

  useEffect(() => {
    console.log('selectedGroup:', selectedGroup)
  }, [])

  return (
    <DashboardStyled>
      <p onClick={handleClose}>cerrar grupo</p>
      <p>esto es el dashboard del grupo {selectedGroup.groupName}</p>
    </DashboardStyled>
  )
}
