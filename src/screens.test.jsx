import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { vi } from 'vitest'
import { createAppStore } from './redux/store'
import { initialState } from './redux/reducers'
import Login from './components/Login'
import SignUp from './components/SignUp'
import Dashboard from './components/Dashboard'

const authMocks = vi.hoisted(() => ({ signIn: vi.fn(), createUser: vi.fn() }))
const serviceMocks = vi.hoisted(() => ({ group: null, startShuffleStage: vi.fn() }))

vi.mock('./firebase', () => ({ auth: {}, db: {} }))

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: authMocks.signIn,
  createUserWithEmailAndPassword: authMocks.createUser,
  sendPasswordResetEmail: vi.fn(),
}))

vi.mock('./services', () => ({
  subscribeToGroup: (groupId, onChange) => {
    onChange(serviceMocks.group)
    return () => {}
  },
  subscribeToWish: (groupId, uid, onChange) => {
    onChange('Un libro')
    return () => {}
  },
  getUsers: async uids => uids.map(uid => ({ uid, name: `Nombre ${uid}`, email: `${uid}@example.com` })),
  getReceiver: async () => ({ uid: 'bea', name: 'Nombre bea', wish: 'Calcetines' }),
  getOwnRating: async () => null,
  startShuffleStage: serviceMocks.startShuffleStage,
  createUserProfile: vi.fn(),
}))

let consoleError

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error')
  serviceMocks.startShuffleStage.mockReset()
})

afterEach(() => {
  // Cualquier aviso de React o MUI (props inválidas, keys, etc.) hace fallar el test
  expect(consoleError).not.toHaveBeenCalled()
  consoleError.mockRestore()
})

function renderWithStore(ui, state = {}) {
  const store = createAppStore({ ...initialState, ...state })
  render(<Provider store={store}>{ui}</Provider>)
  return store
}

const ana = { uid: 'ana', email: 'ana@example.com', name: 'Ana' }

test('login shows a translated error for wrong credentials', async () => {
  authMocks.signIn.mockRejectedValue({ code: 'auth/invalid-credential' })
  const store = renderWithStore(<Login />)
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/Email/), 'ana@example.com')
  await user.type(screen.getByLabelText(/Contraseña/), 'secreto123')
  await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
  expect(store.getState().snackbar.message).toBe('El email o la contraseña no son correctos.')
})

test('sign up refuses passwords that do not match', async () => {
  const store = renderWithStore(<SignUp />)
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/Nombre/), 'Ana')
  await user.type(screen.getByLabelText(/^Email/), 'ana@example.com')
  await user.type(screen.getByLabelText(/^Contraseña/), 'secreto123')
  await user.type(screen.getByLabelText(/Repite la contraseña/), 'secreto124')
  await user.click(screen.getByRole('button', { name: 'Regístrate' }))
  expect(authMocks.createUser).not.toHaveBeenCalled()
  expect(store.getState().snackbar.message).toBe('Las contraseñas no son iguales.')
})

test('dashboard shows members, requests and the start button to the admin', async () => {
  serviceMocks.group = {
    id: 'g1', name: 'Familia', admin: 'ana', users: ['ana', 'bea'], requests: ['carlos'],
    shuffleStage: false, shufflers: [],
  }
  renderWithStore(<Dashboard />, { user: ana, showDashboard: true, selectedGroup: { id: 'g1' } })
  expect(screen.getByRole('heading', { name: 'Familia' })).toBeInTheDocument()
  expect(screen.getByDisplayValue('Un libro')).toBeInTheDocument()
  expect(await screen.findByText('Nombre bea')).toBeInTheDocument()
  expect(await screen.findByText('Nombre carlos')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Listo para sorteo' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Expulsar miembro: Nombre bea' })).toBeInTheDocument()
})

test('dashboard closes when the user is no longer a member', () => {
  serviceMocks.group = {
    id: 'g1', name: 'Familia', admin: 'bea', users: ['bea'], requests: [], shuffleStage: false, shufflers: [],
  }
  const store = renderWithStore(<Dashboard />, { user: ana, showDashboard: true, selectedGroup: { id: 'g1' } })
  expect(store.getState().showDashboard).toBe(false)
})

test('dashboard shows the receiver and the satisfaction once more than half rated', async () => {
  serviceMocks.group = {
    id: 'g1', name: 'Familia', admin: 'bea', users: ['ana', 'bea', 'carlos'], requests: [],
    shuffleStage: true, shufflers: ['ana'], ratingSum: 9, ratingCount: 2,
  }
  renderWithStore(<Dashboard />, { user: ana, showDashboard: true, selectedGroup: { id: 'g1' } })
  expect(await screen.findByText(/Calcetines/)).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Nombre bea' })).toBeInTheDocument()
  expect(screen.getByText('¡Bien hecho!')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Ya recibí mi regalo' })).toBeInTheDocument()
})

test('admin cannot start the draw alone', async () => {
  serviceMocks.group = {
    id: 'g1', name: 'Familia', admin: 'ana', users: ['ana'], requests: [], shuffleStage: false, shufflers: [],
  }
  const store = renderWithStore(<Dashboard />, { user: ana, showDashboard: true, selectedGroup: { id: 'g1' } })
  await userEvent.setup().click(screen.getByRole('button', { name: 'Listo para sorteo' }))
  await waitFor(() => expect(store.getState().snackbar.message).toBe('Se necesitan al menos dos miembros en el grupo para poder sortear.'))
  expect(serviceMocks.startShuffleStage).not.toHaveBeenCalled()
})
