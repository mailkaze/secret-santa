export default function reducer(state, action) {
  switch(action.type) {
    case 'SET_USER':
      return {...state, user: action.payload}
    case 'TOGGLE_SHOW_SIGNUP':
      return {state, showSignUp: !state.showSignUp}
    case 'TOGGLE_SHOW_LOGIN':
      return {state, showLogin: !state.showLogin}
    default:
      return state
  }
}