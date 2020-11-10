import { createStore } from 'redux'
import reducer from './reducers'

const initialState = {
  user: null,
  showSignUp: false,
  showLogin: false,

}

export default createStore(reducer, initialState)
