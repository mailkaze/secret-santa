import { createStore } from 'redux'
import reducer from './reducers'

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
  // showSnackbar: false,
  // snackbarSeverity: 'info',
  // snackbarMessage:'',
  selectedGroup: {},
  search: '',
  
}

export default createStore(reducer, initialState)
