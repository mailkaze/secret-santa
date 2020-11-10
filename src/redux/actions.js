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