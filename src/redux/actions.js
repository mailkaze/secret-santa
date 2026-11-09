import { deleteGroup, removeMember } from '../services'
import { GENERIC_ERROR } from '../utils'

export function setUser(userData) {
  return { type: 'SET_USER', payload: userData }
}

export function updateUser(profile) {
  return { type: 'UPDATE_USER', payload: profile }
}

export function setUserGroups(groups) {
  return { type: 'SET_USER_GROUPS', payload: groups }
}

export function setUserRequests(groups) {
  return { type: 'SET_USER_REQUESTS', payload: groups }
}

export function setShowSignUp(showSignUp) {
  return { type: 'SET_SHOW_SIGNUP', payload: showSignUp }
}

export function setShowLogin(showLogin) {
  return { type: 'SET_SHOW_LOGIN', payload: showLogin }
}

export function openDashboard(groupId) {
  return { type: 'OPEN_DASHBOARD', payload: groupId }
}

export function closeDashboard() {
  return { type: 'CLOSE_DASHBOARD' }
}

export function setSelectedGroup(groupData) {
  return { type: 'SET_SELECTED_GROUP', payload: groupData }
}

export function setSearch(search) {
  return { type: 'SET_SEARCH', payload: search }
}

export function setSnackbar(snackbar) {
  return { type: 'SET_SNACKBAR', payload: snackbar }
}

export function notify(severity, message) {
  return setSnackbar({ show: true, severity, message })
}

export function resetState() {
  return { type: 'RESET_STATE' }
}

// El admin elimina el grupo; el resto de miembros lo abandona. Devuelve true si se ha completado.
export function leaveOrDeleteGroup(group) {
  return async (dispatch, getState) => {
    const { uid } = getState().user
    try {
      if (group.admin === uid) {
        if (!window.confirm('Si eliminas el grupo nadie podrá acceder a él y se borrarán todos los datos de regalos y sorteos, ¿deseas eliminar este grupo?')) return false
        await deleteGroup(group)
        dispatch(notify('success', 'El grupo se ha eliminado con éxito.'))
        return true
      }
      if (group.shuffleStage) {
        dispatch(notify('error', 'No se puede abandonar el grupo durante la fase de sorteo.'))
        return false
      }
      if (!window.confirm('¿Abandonar este grupo?')) return false
      await removeMember(group.id, uid)
      dispatch(notify('info', 'Has abandonado este grupo.'))
      return true
    } catch {
      dispatch(notify('error', GENERIC_ERROR))
      return false
    }
  }
}
