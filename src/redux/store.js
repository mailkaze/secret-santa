import { createStore } from 'redux'
import reducer from './reducers'

const initialState = {
  user: null,
  showSignUp: false,
  showLogin: false,
  showDashboard: false,
  selectedGroup: {},
  search: '',
  
}

export default createStore(reducer, initialState)
