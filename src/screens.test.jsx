import { StrictMode } from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { createAppStore } from './redux/store'
import { initialState } from './redux/reducers'
import AppProviders from './components/AppProviders'
import Login from './components/Login'
import SignUp from './components/SignUp'
import Dashboard from './components/Dashboard'
import NavBar from './components/NavBar'

const authMocks = vi.hoisted(() => ({
  auth: { currentUser: null },
  signIn: vi.fn(),
  createUser: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}))
const serviceMocks = vi.hoisted(() => ({
  group: null,
  wishes: {},
  groupListener: null,
  wishListeners: {},
  createUserProfile: vi.fn(),
  startShuffleStage: vi.fn(),
  resetShuffle: vi.fn(),
  removeMember: vi.fn(),
  acceptRequest: vi.fn(),
  deleteGroup: vi.fn(),
  markAsShuffled: vi.fn(),
  saveWish: vi.fn(),
  saveRating: vi.fn(),
}))

vi.mock('./firebase', () => ({ auth: authMocks.auth, db: {} }))

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: authMocks.signIn,
  createUserWithEmailAndPassword: authMocks.createUser,
  sendPasswordResetEmail: authMocks.sendPasswordResetEmail,
  signOut: vi.fn(),
}))

// Las instantáneas llegan de forma asíncrona, como en Firestore, y dejan de llegar al cancelar
function later(listener, value) {
  Promise.resolve().then(() => listener.active && listener.onChange(value))
}

vi.mock('./services', () => ({
  subscribeToGroup: (groupId, onChange) => {
    const listener = { onChange, active: true }
    serviceMocks.groupListener = listener
    later(listener, serviceMocks.group)
    return () => { listener.active = false }
  },
  subscribeToWish: (groupId, uid, onChange) => {
    const listener = { onChange, active: true }
    serviceMocks.wishListeners[uid] = listener
    later(listener, serviceMocks.wishes[uid] ?? '¡Cualquier cosa!')
    return () => { listener.active = false }
  },
  getUsers: async uids => uids.map(uid => ({ uid, name: `Nombre ${uid}`, email: `${uid}@example.com` })),
  getReceiver: async () => {
    if (serviceMocks.receiverOffline) throw new Error('offline')
    return { uid: 'bea', name: 'Nombre bea', wish: 'Calcetines' }
  },
  getOwnRating: async () => null,
  createUserProfile: serviceMocks.createUserProfile,
  startShuffleStage: serviceMocks.startShuffleStage,
  resetShuffle: serviceMocks.resetShuffle,
  removeMember: serviceMocks.removeMember,
  acceptRequest: serviceMocks.acceptRequest,
  deleteGroup: serviceMocks.deleteGroup,
  markAsShuffled: serviceMocks.markAsShuffled,
  saveWish: serviceMocks.saveWish,
  saveRating: serviceMocks.saveRating,
  sendRequest: vi.fn(),
  cancelRequest: vi.fn(),
}))

let consoleError

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  authMocks.auth.currentUser = null
  authMocks.signIn.mockReset()
  authMocks.createUser.mockReset()
  Object.values(serviceMocks).forEach(mock => mock?.mockReset?.())
  serviceMocks.wishes = { ana: 'Un libro' }
  serviceMocks.wishListeners = {}
  serviceMocks.receiverOffline = false
  consoleError = vi.spyOn(console, 'error')
  vi.spyOn(window, 'confirm')
})

afterEach(() => {
  // Cualquier aviso de React o MUI (props inválidas, keys, act, etc.) hace fallar el test
  expect(consoleError).not.toHaveBeenCalled()
  // Las confirmaciones son diálogos de MUI, nunca window.confirm
  expect(window.confirm).not.toHaveBeenCalled()
  vi.restoreAllMocks()
  delete window.matchMedia
})

function renderWithProviders(ui, state = {}) {
  const store = createAppStore({ ...initialState, ...state })
  render(<StrictMode><AppProviders store={store}>{ui}</AppProviders></StrictMode>)
  return store
}

function renderDashboard(group, user = ana) {
  serviceMocks.group = group
  return renderWithProviders(<Dashboard groupId={group.id} />, { user })
}

function mockReducedMotion() {
  window.matchMedia = query => ({
    matches: query.includes('prefers-reduced-motion: reduce'),
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() { return false },
  })
}

const ana = { uid: 'ana', email: 'ana@example.com', name: 'Ana' }
const openGroup = {
  id: 'g1', name: 'Familia', admin: 'ana', users: ['ana', 'bea'], requests: ['carlos'], shuffleStage: false, shufflers: [],
}

async function fillSignUp(user, { password2 = 'secreto123' } = {}) {
  await user.type(screen.getByLabelText(/Nombre/), 'Ana')
  await user.type(screen.getByLabelText(/^Email/), 'ana@example.com')
  await user.type(screen.getByLabelText(/^Contraseña/), 'secreto123')
  await user.type(screen.getByLabelText(/Repite la contraseña/), password2)
}

describe('login', () => {
  test('shows a translated error for wrong credentials', async () => {
    authMocks.signIn.mockRejectedValue({ code: 'auth/invalid-credential' })
    const store = renderWithProviders(<Login returnTo="/" />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/Email/), 'ana@example.com')
    await user.type(screen.getByLabelText(/Contraseña/), 'secreto123')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    await waitFor(() => expect(store.getState().snackbar.message).toBe('El email o la contraseña no son correctos.'))
  })

  test('ignores a second click while it is signing in', async () => {
    authMocks.signIn.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<Login returnTo="/" />)
    // MUI quita los eventos de puntero a los botones desactivados; el segundo clic debe intentarse igualmente
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    await user.type(screen.getByLabelText(/Email/), 'ana@example.com')
    await user.type(screen.getByLabelText(/Contraseña/), 'secreto123')
    const submit = screen.getByRole('button', { name: 'Iniciar sesión' })
    await user.click(submit)
    await user.click(submit)
    expect(authMocks.signIn).toHaveBeenCalledTimes(1)
    expect(submit).toBeDisabled()
  })
})

describe('sign up', () => {
  test('asks to fill every field', async () => {
    const store = renderWithProviders(<SignUp returnTo="/" />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(authMocks.createUser).not.toHaveBeenCalled()
    expect(store.getState().snackbar.message).toBe('Rellena todos los campos.')
  })

  test('refuses passwords that do not match', async () => {
    const store = renderWithProviders(<SignUp returnTo="/" />)
    const user = userEvent.setup()
    await fillSignUp(user, { password2: 'secreto124' })
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(authMocks.createUser).not.toHaveBeenCalled()
    expect(store.getState().snackbar.message).toBe('Las contraseñas no son iguales.')
  })

  test('retries only the profile when the account was already created', async () => {
    authMocks.createUser.mockImplementation(async (auth, email) => {
      auth.currentUser = { uid: 'ana', email }
      return { user: auth.currentUser }
    })
    serviceMocks.createUserProfile.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce()
    const store = renderWithProviders(<SignUp returnTo="/grupo/g1" />)
    const user = userEvent.setup()
    await fillSignUp(user)
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    await waitFor(() => expect(store.getState().snackbar.severity).toBe('error'))
    expect(serviceMocks.createUserProfile).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    await waitFor(() => expect(serviceMocks.createUserProfile).toHaveBeenCalledTimes(2))
    expect(authMocks.createUser).toHaveBeenCalledTimes(1)
    expect(serviceMocks.createUserProfile).toHaveBeenLastCalledWith('ana', 'Ana', 'ana@example.com')
    await waitFor(() => expect(window.location.hash).toBe('#/grupo/g1'))
  })

  test('a late profile confirmation does not pull the user back after they moved on', async () => {
    authMocks.createUser.mockImplementation(async (auth, email) => ({ user: { uid: 'ana', email } }))
    let confirmProfile
    serviceMocks.createUserProfile.mockImplementation(() => new Promise(resolve => { confirmProfile = resolve }))
    window.history.replaceState(null, '', '/#/registro')
    renderWithProviders(<SignUp returnTo="/" />)
    const user = userEvent.setup()
    await fillSignUp(user)
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    await waitFor(() => expect(serviceMocks.createUserProfile).toHaveBeenCalled())
    act(() => { window.location.hash = '/grupo/g9' })
    await act(async () => confirmProfile())
    expect(window.location.hash).toBe('#/grupo/g9')
  })
})

describe('dashboard', () => {
  test('shows members, requests and the start button to the admin', async () => {
    renderDashboard(openGroup)
    expect(await screen.findByRole('heading', { name: 'Familia' })).toBeInTheDocument()
    expect(await screen.findByDisplayValue('Un libro')).toBeInTheDocument()
    expect(await screen.findByText('Nombre bea')).toBeInTheDocument()
    expect(await screen.findByText('Nombre carlos')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Empezar sorteo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expulsar a Nombre bea' })).toBeInTheDocument()
    expect(screen.getByText('Administrador')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reiniciar sorteo' })).not.toBeInTheDocument()
  })

  test('shows the default wish as a placeholder and saves it when the field is empty', async () => {
    serviceMocks.wishes = {}
    serviceMocks.saveWish.mockResolvedValue()
    renderDashboard(openGroup)
    const user = userEvent.setup()
    const wish = await screen.findByRole('textbox', { name: /Qué te gustaría que te regalaran/ })
    expect(wish).toHaveValue('')
    expect(wish).toHaveAttribute('placeholder', '¡Cualquier cosa!')
    expect(screen.getByText('Quien te regale verá este texto')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Guardar deseo' }))
    expect(serviceMocks.saveWish).toHaveBeenCalledWith('g1', 'ana', '¡Cualquier cosa!')
  })

  test('says there are no pending requests', async () => {
    renderDashboard({ ...openGroup, requests: [] })
    expect(await screen.findByText('No hay solicitudes pendientes.')).toBeInTheDocument()
  })

  test('accepts a join request', async () => {
    serviceMocks.acceptRequest.mockResolvedValue()
    renderDashboard(openGroup)
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Aceptar a Nombre carlos' }))
    expect(serviceMocks.acceptRequest).toHaveBeenCalledWith('g1', 'carlos')
  })

  test('returns to the group list when the user is expelled', async () => {
    renderDashboard({ ...openGroup, admin: 'bea' })
    expect(await screen.findByRole('heading', { name: 'Familia' })).toBeInTheDocument()
    act(() => serviceMocks.groupListener.onChange({ ...openGroup, admin: 'bea', users: ['bea'] }))
    await waitFor(() => expect(window.location.hash).toBe('#/'))
  })

  test('shows the receiver with a live wish and the satisfaction once more than half rated', async () => {
    serviceMocks.wishes = { ana: 'Un libro', bea: 'Calcetines' }
    renderDashboard({
      id: 'g1', name: 'Familia', admin: 'bea', users: ['ana', 'bea', 'carlos'], requests: [],
      shuffleStage: true, shufflers: ['ana'], ratingSum: 9, ratingCount: 2,
    })
    expect(await screen.findByRole('heading', { name: 'Nombre bea' })).toBeInTheDocument()
    expect(await screen.findByText('Calcetines')).toBeInTheDocument()
    act(() => serviceMocks.wishListeners.bea.onChange('Una bufanda'))
    expect(screen.getByText('Una bufanda')).toBeInTheDocument()
    expect(screen.getByText('¡Bien hecho!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ya he recibido mi regalo' })).toBeInTheDocument()
  })

  test('lets the member retry when their draw cannot be loaded', async () => {
    serviceMocks.receiverOffline = true
    renderDashboard({
      id: 'g1', name: 'Familia', admin: 'bea', users: ['ana', 'bea', 'carlos'], requests: [],
      shuffleStage: true, shufflers: ['ana'],
    })
    const retry = await screen.findByRole('button', { name: 'Reintentar' })
    serviceMocks.receiverOffline = false
    await userEvent.setup().click(retry)
    expect(await screen.findByRole('heading', { name: 'Nombre bea' })).toBeInTheDocument()
  })

  test('the app bar login link keeps the way back to an invite link', async () => {
    window.history.replaceState(null, '', '/#/grupo/g1')
    renderWithProviders(<NavBar />)
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '#/entrar?volver=%2Fgrupo%2Fg1')
  })

  test('the admin cannot start the draw alone', async () => {
    const store = renderDashboard({ ...openGroup, users: ['ana'], requests: [] })
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Empezar sorteo' }))
    await waitFor(() => expect(store.getState().snackbar.message).toBe('Se necesitan al menos dos miembros en el grupo para poder sortear.'))
    expect(serviceMocks.startShuffleStage).not.toHaveBeenCalled()
  })

  test('starting the draw asks for confirmation in a dialog', async () => {
    serviceMocks.startShuffleStage.mockResolvedValue()
    renderDashboard(openGroup)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Empezar sorteo' }))
    let dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('¿Empezar el sorteo de «Familia»?')
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(serviceMocks.startShuffleStage).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Empezar sorteo' }))
    dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Empezar sorteo' }))
    await waitFor(() => expect(serviceMocks.startShuffleStage).toHaveBeenCalledWith(expect.objectContaining({ id: 'g1' })))
  })

  test('a pending confirmation is dismissed when the user navigates away', async () => {
    renderDashboard(openGroup)
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Empezar sorteo' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    act(() => { window.location.hash = '/' })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(serviceMocks.startShuffleStage).not.toHaveBeenCalled()
  })

  test('offers the reset only during the draw and says what it deletes', async () => {
    serviceMocks.resetShuffle.mockResolvedValue()
    renderDashboard({ ...openGroup, requests: [], shuffleStage: true, shufflers: ['ana'] })
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Reiniciar sorteo' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Se borrarán el sorteo, los deseos y las valoraciones.')
    expect(dialog).toHaveTextContent('Se mantienen los miembros y las solicitudes.')
    await user.click(within(dialog).getByRole('button', { name: 'Reiniciar sorteo' }))
    await waitFor(() => expect(serviceMocks.resetShuffle).toHaveBeenCalledWith(expect.objectContaining({ id: 'g1' })))
  })

  test('expelling a member names the person and asks for confirmation', async () => {
    serviceMocks.removeMember.mockResolvedValue()
    renderDashboard(openGroup)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Expulsar a Nombre bea' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Expulsar a Nombre bea' }))
    await waitFor(() => expect(serviceMocks.removeMember).toHaveBeenCalledWith('g1', 'bea'))
  })

  test('a member leaves the group after confirming', async () => {
    serviceMocks.removeMember.mockResolvedValue()
    renderDashboard({ ...openGroup, admin: 'bea', requests: [] })
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Salir del grupo' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Salir de «Familia»' }))
    await waitFor(() => expect(serviceMocks.removeMember).toHaveBeenCalledWith('g1', 'ana'))
    await waitFor(() => expect(window.location.hash).toBe('#/'))
  })

  test('the admin deletes the group after confirming', async () => {
    serviceMocks.deleteGroup.mockResolvedValue()
    renderDashboard(openGroup)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Eliminar grupo' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Esta acción no se puede deshacer.')
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar «Familia»' }))
    await waitFor(() => expect(serviceMocks.deleteGroup).toHaveBeenCalledWith(expect.objectContaining({ id: 'g1' })))
  })

  test('invites people by copying the group link', async () => {
    const store = renderDashboard(openGroup)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Invitar' }))
    await waitFor(() => expect(store.getState().snackbar.message).toMatch(/Enlace copiado/))
    expect(await navigator.clipboard.readText()).toMatch(/#\/grupo\/g1$/)
  })

  test('reveal flow keeps the present hidden until the modal closes', async () => {
    mockReducedMotion()
    const group = { ...openGroup, admin: 'bea', requests: [], shuffleStage: true, shufflers: [] }
    serviceMocks.markAsShuffled.mockImplementation(async () => {
      later(serviceMocks.groupListener, { ...group, shufflers: ['ana'] })
    })
    renderDashboard(group)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Sortear' }))
    expect(serviceMocks.markAsShuffled).toHaveBeenCalledWith('g1', 'ana')
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('status')).toHaveTextContent('Te toca regalar a Nombre bea.')
    expect(screen.queryByRole('heading', { name: 'Nombre bea', hidden: true })).not.toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Cerrar' }))
    expect(await screen.findByRole('heading', { name: 'Nombre bea' })).toBeInTheDocument()
  })

  test('rating uses whole stars with no default and sends the chosen value', async () => {
    serviceMocks.saveRating.mockResolvedValue()
    renderDashboard({ ...openGroup, admin: 'bea', requests: [], shuffleStage: true, shufflers: ['ana'] })
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Ya he recibido mi regalo' }))
    const send = screen.getByRole('button', { name: 'Enviar valoración' })
    expect(send).toBeDisabled()
    expect(screen.queryByRole('radio', { name: '3.5 Estrellas' })).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Vacío' })).toBeChecked()
    // En jsdom el puntero de userEvent hace que Rating calcule la nota con un ancho de 0 px
    fireEvent.click(screen.getByRole('radio', { name: '4 Estrellas' }))
    expect(send).toBeEnabled()
    await user.click(send)
    await waitFor(() => expect(serviceMocks.saveRating).toHaveBeenCalledWith('g1', 'ana', 4))
  })
})
