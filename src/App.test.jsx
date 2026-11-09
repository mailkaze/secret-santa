import { StrictMode } from 'react'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import App from './App'
import AppProviders from './components/AppProviders'
import { createAppStore } from './redux/store'
import { initialState } from './redux/reducers'
import { notify } from './redux/actions'

// Firebase se sustituye por dobles: los tests no deben tocar el proyecto real
const authState = vi.hoisted(() => ({ user: null, deferred: false, callback: null }))
const mocks = vi.hoisted(() => ({
  createGroup: vi.fn(),
  searchGroups: vi.fn(),
  sendRequest: vi.fn(),
  cancelRequest: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  subscriptions: [],
  userGroups: [],
  userRequests: [],
  groups: {},
  groupListeners: {},
}))

vi.mock('./firebase', () => ({ auth: { currentUser: null }, db: {} }))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (auth, callback) => {
    authState.callback = callback
    if (!authState.deferred) callback(authState.user)
    return () => {}
  },
  signOut: mocks.signOut,
  signInWithEmailAndPassword: mocks.signIn,
  createUserWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}))

// Las instantáneas llegan de forma asíncrona, como en Firestore, y dejan de llegar al cancelar
function later(listener, value) {
  Promise.resolve().then(() => listener.active && listener.onChange(value))
}

vi.mock('./services', async () => {
  const actual = await vi.importActual('./services')
  return {
    GroupExistsError: actual.GroupExistsError,
    createGroup: mocks.createGroup,
    searchGroups: mocks.searchGroups,
    sendRequest: mocks.sendRequest,
    cancelRequest: mocks.cancelRequest,
    getGroup: vi.fn(),
    subscribeToUser: () => () => {},
    subscribeToUserGroups: (uid, field, onChange) => {
      mocks.subscriptions.push(field)
      const listener = { onChange, active: true }
      later(listener, field === 'users' ? mocks.userGroups : mocks.userRequests)
      return () => { listener.active = false }
    },
    subscribeToGroup: (groupId, onChange) => {
      const listener = { onChange, active: true }
      mocks.groupListeners[groupId] = listener
      later(listener, mocks.groups[groupId] ?? null)
      return () => { listener.active = false }
    },
    subscribeToWish: (groupId, uid, onChange) => {
      const listener = { onChange, active: true }
      later(listener, '¡Cualquier cosa!')
      return () => { listener.active = false }
    },
    getUsers: async uids => uids.map(uid => ({ uid, name: `Nombre ${uid}`, email: `${uid}@example.com` })),
    getReceiver: async () => null,
    getOwnRating: async () => null,
  }
})

const ana = { uid: 'ana', email: 'ana@example.com' }
const familia = {
  id: 'g1', name: 'Familia', admin: 'ana', users: ['ana', 'bea'], requests: [], shuffleStage: false, shufflers: [],
}
const amigos = {
  id: 'g2', name: 'Amigos', admin: 'bea', users: ['bea'], requests: [], shuffleStage: false, shufflers: [],
}

let consoleError

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  authState.user = null
  authState.deferred = false
  authState.callback = null
  Object.values(mocks).forEach(mock => mock.mockReset?.())
  mocks.subscriptions.length = 0
  mocks.userGroups = [{ id: 'g1', name: 'Familia' }]
  mocks.userRequests = []
  mocks.groups = { g1: familia, g2: amigos }
  mocks.groupListeners = {}
  consoleError = vi.spyOn(console, 'error')
})

afterEach(() => {
  // Cualquier aviso de React o MUI (props inválidas, keys, act, etc.) hace fallar el test
  expect(consoleError).not.toHaveBeenCalled()
  consoleError.mockRestore()
})

function renderApp() {
  const store = createAppStore(initialState)
  render(<StrictMode><AppProviders store={store}><App /></AppProviders></StrictMode>)
  return store
}

function emitGroup(groupId, data) {
  act(() => mocks.groupListeners[groupId].onChange(data))
}

test('shows a splash until Firebase reports the session, without flashing the welcome screen', async () => {
  authState.deferred = true
  renderApp()
  expect(screen.getByRole('progressbar', { name: 'Cargando' })).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Crear cuenta' })).not.toBeInTheDocument()
  act(() => authState.callback(null))
  expect(await screen.findByRole('link', { name: 'Crear cuenta' })).toBeInTheDocument()
})

test('shows the welcome screen with sign-up and login links when nobody is logged in', () => {
  renderApp()
  expect(screen.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute('href', '#/registro')
  expect(screen.getByRole('link', { name: 'Ya tengo cuenta' })).toHaveAttribute('href', '#/entrar')
  expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '#/entrar')
})

test('routes with the hash so the browser back button works', async () => {
  renderApp()
  await userEvent.setup().click(screen.getByRole('link', { name: 'Ya tengo cuenta' }))
  expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  expect(window.location.hash).toBe('#/entrar')
  act(() => window.history.back())
  expect(await screen.findByRole('link', { name: 'Ya tengo cuenta' })).toBeInTheDocument()
})

test('opens the sign-up screen from its route', () => {
  window.history.replaceState(null, '', '/#/registro')
  renderApp()
  expect(screen.getByRole('heading', { name: 'Crear cuenta' })).toBeInTheDocument()
})

test('shows the user groups from Firestore when logged in', async () => {
  authState.user = ana
  renderApp()
  expect(await screen.findByRole('link', { name: /Familia/ })).toHaveAttribute('href', '#/grupo/g1')
  expect(screen.getByRole('heading', { name: 'Tus grupos' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
  expect(mocks.subscriptions.sort()).toEqual(['requests', 'users'])
})

test('sends a logged-in user away from the login route', async () => {
  window.history.replaceState(null, '', '/#/entrar')
  authState.user = ana
  renderApp()
  expect(await screen.findByRole('heading', { name: 'Tus grupos' })).toBeInTheDocument()
  expect(window.location.hash).toBe('#/')
})

test('guides a new user when they are not in any group yet', async () => {
  authState.user = ana
  mocks.userGroups = []
  renderApp()
  expect(await screen.findByText(/Aún no estás en ningún grupo/)).toBeInTheDocument()
})

test('lists pending requests and cancels one after confirming in a dialog', async () => {
  authState.user = ana
  mocks.userRequests = [{ id: 'g2', name: 'Amigos' }]
  mocks.cancelRequest.mockResolvedValue()
  const store = renderApp()
  const user = userEvent.setup()
  const section = (await screen.findByRole('heading', { name: 'Solicitudes pendientes' })).closest('section')
  expect(within(section).getByText('Solicitud pendiente')).toBeInTheDocument()
  await user.click(within(section).getByRole('button', { name: 'Cancelar solicitud a Amigos' }))
  const dialog = await screen.findByRole('dialog')
  expect(dialog).toHaveTextContent('Amigos')
  await user.click(within(dialog).getByRole('button', { name: 'Cancelar solicitud' }))
  await waitFor(() => expect(mocks.cancelRequest).toHaveBeenCalledWith('g2', 'ana'))
  await waitFor(() => expect(store.getState().snackbar.message).toBe('Has cancelado tu solicitud para unirte a «Amigos».'))
})

test('rejects an empty group name without writing to Firestore', async () => {
  authState.user = ana
  const store = renderApp()
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Crear grupo' }))
  const dialog = await screen.findByRole('dialog')
  await user.type(within(dialog).getByLabelText(/Nombre del grupo/), '   ')
  await user.click(within(dialog).getByRole('button', { name: 'Crear' }))
  expect(mocks.createGroup).not.toHaveBeenCalled()
  expect(store.getState().snackbar).toMatchObject({ show: true, severity: 'error', message: 'Escribe un nombre para el grupo.' })
})

test('tells the user when the group name is already taken', async () => {
  authState.user = ana
  const { GroupExistsError } = await vi.importActual('./services')
  mocks.createGroup.mockRejectedValue(new GroupExistsError())
  const store = renderApp()
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Crear grupo' }))
  const dialog = await screen.findByRole('dialog')
  await user.type(within(dialog).getByLabelText(/Nombre del grupo/), ' familia ')
  await user.click(within(dialog).getByRole('button', { name: 'Crear' }))
  expect(mocks.createGroup).toHaveBeenCalledWith(' familia ', 'ana')
  expect(store.getState().snackbar).toMatchObject({ show: true, severity: 'error', message: 'Ya existe un grupo con ese nombre.' })
})

test('opens the new group after creating it', async () => {
  authState.user = ana
  mocks.createGroup.mockResolvedValue('g1')
  renderApp()
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Crear grupo' }))
  const dialog = await screen.findByRole('dialog')
  await user.type(within(dialog).getByLabelText(/Nombre del grupo/), 'Familia')
  await user.click(within(dialog).getByRole('button', { name: 'Crear' }))
  await waitFor(() => expect(window.location.hash).toBe('#/grupo/g1'))
  expect(await screen.findByRole('heading', { name: 'Familia' })).toBeInTheDocument()
})

test('sends a request from the search results and clears the search box', async () => {
  authState.user = ana
  mocks.searchGroups.mockResolvedValue([{ id: 'g2', name: 'Amigos' }])
  mocks.sendRequest.mockResolvedValue()
  const store = renderApp()
  const user = userEvent.setup()
  const searchBox = await screen.findByRole('searchbox', { name: 'Buscar grupos' })
  await user.type(searchBox, '  AMIGOS ')
  await user.click(screen.getByRole('button', { name: 'Buscar' }))
  expect(mocks.searchGroups).toHaveBeenCalledWith('amigos')
  await user.click(await screen.findByRole('button', { name: 'Solicitar unirme a Amigos' }))
  expect(mocks.sendRequest).toHaveBeenCalledWith('g2', 'ana')
  await waitFor(() => expect(searchBox).toHaveValue(''))
  expect(store.getState().search).toBe('')
  expect(await screen.findByRole('link', { name: /Familia/ })).toBeInTheDocument()
})

test('says so when a search finds nothing', async () => {
  authState.user = ana
  mocks.searchGroups.mockResolvedValue([])
  renderApp()
  const user = userEvent.setup()
  await user.type(await screen.findByRole('searchbox', { name: 'Buscar grupos' }), 'zzz')
  await user.click(screen.getByRole('button', { name: 'Buscar' }))
  expect(await screen.findByText('No hay ningún grupo que coincida con «zzz».')).toBeInTheDocument()
})

test('opens a group from an invite link after logging in', async () => {
  window.history.replaceState(null, '', '/#/grupo/g1')
  mocks.signIn.mockImplementation(async (auth, email) => {
    act(() => authState.callback({ uid: 'ana', email }))
  })
  renderApp()
  const user = userEvent.setup()
  expect(screen.getByText('Inicia sesión para ver este grupo.')).toBeInTheDocument()
  await user.type(screen.getByLabelText(/Email/), 'ana@example.com')
  await user.type(screen.getByLabelText(/Contraseña/), 'secreto123')
  await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
  expect(await screen.findByRole('heading', { name: 'Familia' })).toBeInTheDocument()
  expect(window.location.hash).toBe('#/grupo/g1')
})

test('shows non-members a preview where they can ask to join', async () => {
  window.history.replaceState(null, '', '/#/grupo/g2')
  authState.user = ana
  mocks.sendRequest.mockResolvedValue()
  renderApp()
  const user = userEvent.setup()
  expect(await screen.findByRole('heading', { name: 'Amigos' })).toBeInTheDocument()
  expect(screen.getByText('No eres miembro de este grupo.')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Solicitar unirme' }))
  expect(mocks.sendRequest).toHaveBeenCalledWith('g2', 'ana')
  emitGroup('g2', { ...amigos, requests: ['ana'] })
  expect(screen.getByText(/Tu solicitud está pendiente/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Cancelar solicitud' })).toBeInTheDocument()
  emitGroup('g2', { ...amigos, users: ['bea', 'ana'], requests: [] })
  expect(await screen.findByRole('textbox', { name: /Qué te gustaría que te regalaran/ })).toBeInTheDocument()
})

test('says when a group does not exist', async () => {
  window.history.replaceState(null, '', '/#/grupo/nope')
  authState.user = ana
  renderApp()
  expect(await screen.findByText('No hemos encontrado este grupo.')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Volver a tus grupos' })).toHaveAttribute('href', '#/')
})

test('logs out and returns to the welcome screen', async () => {
  window.history.replaceState(null, '', '/#/grupo/g1')
  authState.user = ana
  mocks.signOut.mockImplementation(async () => {
    act(() => authState.callback(null))
  })
  const store = renderApp()
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Cerrar sesión' }))
  expect(mocks.signOut).toHaveBeenCalledTimes(1)
  expect(await screen.findByRole('link', { name: 'Crear cuenta' })).toBeInTheDocument()
  expect(window.location.hash).toBe('#/')
  expect(store.getState().user).toBeNull()
})

test('gives every notification its own id so repeated messages restart the snackbar', () => {
  const first = notify('info', 'Hola')
  const second = notify('info', 'Hola')
  expect(first.payload.id).not.toBe(second.payload.id)
})
