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

export function setSearch(search) {
  return { type: 'SET_SEARCH', payload: search }
}

export function setSnackbar(snackbar) {
  return { type: 'SET_SNACKBAR', payload: snackbar }
}

let lastSnackbarId = 0

// Cada aviso lleva su id: el snackbar se reinicia aunque el mensaje se repita
export function notify(severity, message) {
  lastSnackbarId += 1
  return setSnackbar({ id: lastSnackbarId, show: true, severity, message })
}

export function resetState() {
  return { type: 'RESET_STATE' }
}

// El admin elimina el grupo; el resto de miembros lo abandona. Devuelve true si se ha completado.
// confirm es la función de useConfirm: muestra un diálogo y resuelve true o false.
export function leaveOrDeleteGroup(group, confirm) {
  return async (dispatch, getState) => {
    const { uid } = getState().user
    const isAdmin = group.admin === uid
    if (!isAdmin && group.shuffleStage) {
      dispatch(notify('error', 'No puedes salir del grupo mientras dura el sorteo.'))
      return false
    }
    const accepted = await confirm(isAdmin
      ? {
        title: `¿Eliminar el grupo «${group.name}»?`,
        message: 'Nadie podrá volver a entrar y se borrarán el sorteo, los deseos y las valoraciones. Esta acción no se puede deshacer.',
        confirmLabel: `Eliminar «${group.name}»`,
        destructive: true,
      }
      : {
        title: `¿Salir del grupo «${group.name}»?`,
        message: 'Dejarás de ver el grupo y se borrará tu deseo. Si quieres volver, tendrás que pedir unirte otra vez.',
        confirmLabel: `Salir de «${group.name}»`,
        destructive: true,
      })
    if (!accepted) return false
    try {
      if (isAdmin) {
        await deleteGroup(group)
        dispatch(notify('success', `Has eliminado el grupo «${group.name}».`))
      } else {
        await removeMember(group.id, uid)
        dispatch(notify('info', `Has salido del grupo «${group.name}».`))
      }
      return true
    } catch {
      dispatch(notify('error', GENERIC_ERROR))
      return false
    }
  }
}
