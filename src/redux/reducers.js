export default function reducer(state, action) {
  switch(action.type) {
    case 'SET_USER':
      return {...state, user: action.payload}
    case 'TOGGLE_SHOW_SIGNUP':
      return {...state, showSignUp: !state.showSignUp}
    case 'TOGGLE_SHOW_LOGIN':
      return {...state, showLogin: !state.showLogin}
    case 'SET_SHOW_DASHBOARD':
      return {...state, showDashboard: action.payload}
    case 'SET_SELECTED_GROUP':
      return {...state, selectedGroup: action.payload}
    case 'SET_SEARCH':
      return {...state, search: action.payload}
    case 'SET_SNACKBAR':
      return {...state, snackbar: action.payload}
    // case 'SET_SHOW_SNACKBAR':
    //   return {...state, showSnackbar: action.payload}
    // case 'SET_SNACKBAR_SEVERITY':
    //   return {...state, snackbarSeverity: action.payload}
    // case 'SET_SNACKBAR_MESSAGE':
    //   return {...state, snackbarMessage: action.payload}
    default:
      return state
  }
}