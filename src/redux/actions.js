export function setUser(userData) {
  return {
    type: 'SET_USER',
    payload: userData
  }
}

export function toggleShowSignUp() {
  return {
    type: 'TOGGLE_SHOW_SIGNUP',
  }
}

export function toggleShowLogin() {
  return {
    type: 'TOGGLE_SHOW_LOGIN',
  }
}

export function setShowDashboard(show) {
  return {
    type: 'SET_SHOW_DASHBOARD',
    payload: show
  }
}

export function setSelectedGroup(groupData) {
  return {
    type: 'SET_SELECTED_GROUP',
    payload: groupData
  }
}

export function setSearch(search) {
  return {
    type: 'SET_SEARCH',
    payload: search
  }
}

export function setSnackbar(snackbar) {
  return {
    type: 'SET_SNACKBAR',
    payload: snackbar
  }
}

export function resetState() {
  const initialState = {
    user: null,
    showSignUp: false,
    showLogin: false,
    showDashboard: false,
    snackbar: {
      show: false,
      severity: 'info',
      message: 'default message'
    },
    selectedGroup: {},
    search: '',
    
  }
  return {
    type: 'RESET_STATE',
    payload: initialState
  }
}