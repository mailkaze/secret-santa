export const initialState = {
  user: null,
  userGroups: [],
  userRequests: [],
  selectedGroup: {},
  search: '',
  showSignUp: false,
  showLogin: false,
  showDashboard: false,
  snackbar: {
    show: false,
    severity: 'info',
    message: '',
  },
}

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload }
    case 'UPDATE_USER':
      return state.user ? { ...state, user: { ...state.user, ...action.payload } } : state
    case 'SET_USER_GROUPS':
      return { ...state, userGroups: action.payload }
    case 'SET_USER_REQUESTS':
      return { ...state, userRequests: action.payload }
    case 'SET_SHOW_SIGNUP':
      return { ...state, showSignUp: action.payload }
    case 'SET_SHOW_LOGIN':
      return { ...state, showLogin: action.payload }
    case 'OPEN_DASHBOARD':
      return { ...state, showDashboard: true, selectedGroup: { id: action.payload }, search: '' }
    case 'CLOSE_DASHBOARD':
      return { ...state, showDashboard: false, selectedGroup: {} }
    case 'SET_SELECTED_GROUP':
      return { ...state, selectedGroup: action.payload }
    case 'SET_SEARCH':
      return { ...state, search: action.payload }
    case 'SET_SNACKBAR':
      return { ...state, snackbar: action.payload }
    case 'RESET_STATE':
      return initialState
    default:
      return state
  }
}
