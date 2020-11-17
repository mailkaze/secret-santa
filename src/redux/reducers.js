export default function reducer(state, action) {
  switch(action.type) {
    case 'SET_USER':
      return {...state, user: action.payload}
    case 'TOGGLE_SHOW_SIGNUP':
      return {...state, showSignUp: !state.showSignUp}
    case 'TOGGLE_SHOW_LOGIN':
      return {...state, showLogin: !state.showLogin}
    case 'TOGGLE_SHOW_DASHBOARD':
      return {...state, showDashboard: !state.showDashboard}
    case 'SET_SELECTED_GROUP':
      return {...state, selectedGroup: action.payload}
    case 'SET_SEARCH':
      return {...state, search: action.payload}
    default:
      return state
  }
}