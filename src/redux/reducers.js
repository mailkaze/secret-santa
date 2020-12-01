export default function reducer(state, action) {
  switch(action.type) {
    case 'SET_USER':
      return {...state, user: action.payload}
    case 'SET_SHOW_SIGNUP':
      return {...state, showSignUp: action.payload}
    case 'SET_SHOW_LOGIN':
      return {...state, showLogin: action.payload}
    case 'SET_SHOW_DASHBOARD':
      return {...state, showDashboard: action.payload}
    case 'SET_SELECTED_GROUP':
      return {...state, selectedGroup: action.payload}
    case 'SET_SEARCH':
      return {...state, search: action.payload}
    case 'SET_SNACKBAR':
      return {...state, snackbar: action.payload}
      case 'RESET_STATE':
        return {...action.payload}
    default:
      return state
  }
}