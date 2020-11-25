import { createStore } from 'redux'
import reducer from './reducers'

const initialState = {
  user: null,
  selectedGroup: {},
  search: '',
  showSignUp: false,
  showLogin: false,
  showDashboard: false,
  snackbar: {
    show: false,
    severity: 'info',
    message: 'default message'
  },
  
}

export default createStore(reducer, initialState)
