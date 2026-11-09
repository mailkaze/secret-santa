import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { vi } from 'vitest'
import App from './App'
import { createAppStore } from './redux/store'
import { initialState } from './redux/reducers'

// Firebase se sustituye por dobles: los tests no deben tocar el proyecto real
const authState = vi.hoisted(() => ({ user: null }))
const firestoreMocks = vi.hoisted(() => ({
  createGroup: vi.fn(),
  subscriptions: [],
}))

vi.mock('./firebase', () => ({ auth: {}, db: {} }))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (auth, callback) => {
    callback(authState.user)
    return () => {}
  },
  signOut: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}))

vi.mock('./services', async () => {
  const actual = await vi.importActual('./services')
  return {
    GroupExistsError: actual.GroupExistsError,
    createGroup: firestoreMocks.createGroup,
    subscribeToUser: () => () => {},
    subscribeToUserGroups: (uid, field, onChange) => {
      firestoreMocks.subscriptions.push(field)
      onChange(field === 'users' ? [{ id: 'g1', name: 'Familia' }] : [])
      return () => {}
    },
    searchGroups: vi.fn(),
    getGroup: vi.fn(),
    sendRequest: vi.fn(),
    cancelRequest: vi.fn(),
  }
})

function renderApp() {
  const store = createAppStore(initialState)
  render(<Provider store={store}><App /></Provider>)
  return store
}

beforeEach(() => {
  authState.user = null
  firestoreMocks.createGroup.mockReset()
  firestoreMocks.subscriptions.length = 0
})

test('shows the welcome screen when nobody is logged in', () => {
  renderApp()
  expect(screen.getByText(/Bienvenido a la app para organizar intercambios de regalos/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument()
})

test('shows the user groups from Firestore when logged in', () => {
  authState.user = { uid: 'ana', email: 'ana@example.com' }
  renderApp()
  expect(screen.getByText('Familia')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
  expect(firestoreMocks.subscriptions.sort()).toEqual(['requests', 'users'])
})

test('rejects an empty group name without writing to Firestore', async () => {
  authState.user = { uid: 'ana', email: 'ana@example.com' }
  const store = renderApp()
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Crear grupo' }))
  await user.type(screen.getByLabelText(/Nombre del grupo/), '   ')
  await user.click(screen.getByRole('button', { name: 'Crear Grupo' }))
  expect(firestoreMocks.createGroup).not.toHaveBeenCalled()
  expect(store.getState().snackbar).toMatchObject({ show: true, severity: 'error', message: 'Escribe un nombre para el grupo.' })
})

test('tells the user when the group name is already taken', async () => {
  authState.user = { uid: 'ana', email: 'ana@example.com' }
  const { GroupExistsError } = await vi.importActual('./services')
  firestoreMocks.createGroup.mockRejectedValue(new GroupExistsError())
  const store = renderApp()
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Crear grupo' }))
  await user.type(screen.getByLabelText(/Nombre del grupo/), ' familia ')
  await user.click(screen.getByRole('button', { name: 'Crear Grupo' }))
  expect(firestoreMocks.createGroup).toHaveBeenCalledWith(' familia ', 'ana')
  expect(store.getState().snackbar).toMatchObject({ show: true, severity: 'error', message: 'Ya existe un grupo con ese nombre.' })
})
