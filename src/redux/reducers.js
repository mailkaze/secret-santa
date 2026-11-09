export const initialState = {
  user: null,
  userGroups: [],
  userRequests: [],
  // false hasta que llega la primera instantánea de los grupos del usuario
  groupsLoaded: false,
  search: '',
  snackbar: {
    id: 0,
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
      return { ...state, userGroups: action.payload, groupsLoaded: true }
    case 'SET_USER_REQUESTS':
      return { ...state, userRequests: action.payload }
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
