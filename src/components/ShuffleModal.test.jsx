import { StrictMode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import AppProviders from './AppProviders'
import { createAppStore } from '../redux/store'
import ShuffleModal, { buildSequence } from './ShuffleModal'

let consoleError

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error')
  // jsdom no sabe dibujar en un canvas: sin contexto, los efectos no arrancan
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  vi.useFakeTimers()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  expect(consoleError).not.toHaveBeenCalled()
  vi.restoreAllMocks()
  delete HTMLCanvasElement.prototype.clientWidth
  delete HTMLCanvasElement.prototype.clientHeight
  delete window.matchMedia
})

function renderModal(props) {
  const onClose = vi.fn()
  const view = render(
    <StrictMode>
      <AppProviders store={createAppStore()}>
        <ShuffleModal open onClose={onClose} {...props} />
      </AppProviders>
    </StrictMode>
  )
  return { onClose, ...view }
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

// Contexto 2D falso que solo cuenta llamadas (miles de fotogramas no deben pesar) y un rAF manual
function fakeCanvas() {
  const calls = {}
  const context = new Proxy({}, {
    get: (target, prop) => (prop in target ? target[prop] : () => { calls[prop] = (calls[prop] ?? 0) + 1 }),
  })
  vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(context)
  Object.defineProperty(HTMLCanvasElement.prototype, 'clientWidth', { configurable: true, get: () => 360 })
  Object.defineProperty(HTMLCanvasElement.prototype, 'clientHeight', { configurable: true, get: () => 480 })
  const callbacks = []
  vi.stubGlobal('requestAnimationFrame', vi.fn(callback => callbacks.push(callback)))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  let time = 1000
  const nextFrame = () => {
    time += 50
    callbacks.at(-1)(time)
  }
  return { calls, callbacks, nextFrame }
}

const NAMES = ['Ana', 'Bea', 'Carlos', 'Dani', 'Eva', 'Fran', 'Gloria', 'Hugo', 'Inés', 'Juan', 'Kike', 'Lola']
const status = () => screen.getByRole('status')
const shownName = () => screen.getByTestId('shuffle-name').textContent
const actionButtons = () => ['Ver de nuevo', '¡Genial!'].filter(name => screen.queryByRole('button', { name }))
const effectsCanvas = () => document.querySelector('canvas')

// Avanza el reloj a saltos cortos (cada paso programa el siguiente al renderizar) hasta que se revela
// el resultado. Devuelve los nombres en el orden en que se han mostrado y una foto de cada salto.
function runShuffle() {
  const seen = [shownName()]
  const snapshots = []
  for (let i = 0; i < 300 && status().textContent === ''; i++) {
    act(() => vi.advanceTimersByTime(100))
    if (shownName() !== seen.at(-1)) seen.push(shownName())
    snapshots.push({ name: shownName(), announced: status().textContent !== '', buttons: actionButtons().length })
  }
  return { seen, snapshots }
}

test('the sequence suits any group size: never starts on the receiver and always ends on it', () => {
  expect(buildSequence(['Ana'], 'Ana')).toEqual(['Ana'])
  for (let size = 2; size <= 40; size++) {
    const names = Array.from({ length: size }, (_, i) => `P${i}`)
    for (const receiver of [names[0], names.at(-1)]) {
      const sequence = buildSequence(names, receiver)
      expect(sequence[0]).not.toBe(receiver)
      expect(sequence.at(-1)).toBe(receiver)
      expect(sequence.at(-2)).not.toBe(receiver)
      expect(new Set(sequence)).toEqual(new Set(names))
      expect(sequence.every((name, i) => i === 0 || name !== sequence[i - 1])).toBe(true)
    }
  }
})

test('spins the names, lands on the receiver, pauses and only then reveals it with the actions', () => {
  renderModal({ names: NAMES, receiver: 'Bea' })
  expect(status()).toHaveTextContent('')
  expect(actionButtons()).toEqual([])
  expect(effectsCanvas()).toBeInTheDocument()

  const { seen, snapshots } = runShuffle()
  expect(seen[0]).not.toBe('Bea')
  expect(seen.at(-1)).toBe('Bea')
  expect(seen.at(-2)).not.toBe('Bea')
  expect(new Set(seen)).toEqual(new Set(NAMES))

  // Sin botones hasta la revelación, y antes de ella una pausa de suspense con el nombre ya fijado
  const beforeReveal = snapshots.filter(snapshot => !snapshot.announced)
  expect(beforeReveal.every(snapshot => snapshot.buttons === 0)).toBe(true)
  expect(beforeReveal.filter(snapshot => snapshot.name === 'Bea').length).toBeGreaterThanOrEqual(5)

  expect(status()).toHaveTextContent('Te toca regalar a Bea.')
  expect(shownName()).toBe('Bea')
  expect(actionButtons()).toEqual(['Ver de nuevo', '¡Genial!'])
})

test('announces the result once, when it is revealed', () => {
  renderModal({ names: ['Ana', 'Bea', 'Carlos', 'Dani', 'Eva'], receiver: 'Dani' })
  const records = []
  const observer = new MutationObserver(list => records.push(...list))
  observer.observe(status(), { childList: true, characterData: true, subtree: true })

  runShuffle()
  act(() => vi.advanceTimersByTime(20000))
  records.push(...observer.takeRecords())
  observer.disconnect()

  expect(records).toHaveLength(1)
  expect(status()).toHaveTextContent('Te toca regalar a Dani.')
  expect(shownName()).toBe('Dani')
})

test('replays the draw from the start', () => {
  renderModal({ names: NAMES, receiver: 'Bea' })
  runShuffle()

  fireEvent.click(screen.getByRole('button', { name: 'Ver de nuevo' }))
  expect(shownName()).not.toBe('Bea')
  expect(status()).toHaveTextContent('')
  expect(actionButtons()).toEqual([])

  expect(runShuffle().seen.at(-1)).toBe('Bea')
  expect(status()).toHaveTextContent('Te toca regalar a Bea.')
})

test('works with a group of two', () => {
  renderModal({ names: ['Ana', 'Bea'], receiver: 'Bea' })
  const { seen } = runShuffle()
  expect(seen[0]).toBe('Ana')
  expect(seen.length).toBeGreaterThan(5)
  expect(seen.at(-1)).toBe('Bea')
  expect(seen.at(-2)).toBe('Ana')
})

test('shows the result at once and without effects when the user prefers reduced motion', () => {
  mockReducedMotion()
  renderModal({ names: ['Ana', 'Bea', 'Carlos'], receiver: 'Carlos' })
  expect(shownName()).toBe('Carlos')
  expect(status()).toHaveTextContent('Te toca regalar a Carlos.')
  expect(actionButtons()).toEqual(['Ver de nuevo', '¡Genial!'])
  expect(effectsCanvas()).not.toBeInTheDocument()
  expect(HTMLCanvasElement.prototype.getContext).not.toHaveBeenCalled()
})

test('closes from its button once revealed', () => {
  const { onClose } = renderModal({ names: ['Ana', 'Bea'], receiver: 'Bea' })
  runShuffle()
  fireEvent.click(screen.getByRole('button', { name: '¡Genial!' }))
  expect(onClose).toHaveBeenCalled()
})

test('draws snow, bursts confetti on the reveal and stops the loop when the modal goes away', () => {
  const { calls, callbacks, nextFrame } = fakeCanvas()
  const { unmount } = renderModal({ names: ['Ana', 'Bea', 'Carlos'], receiver: 'Bea' })
  expect(callbacks.length).toBeGreaterThan(0)

  for (let i = 0; i < 10; i++) nextFrame()
  expect(calls.arc).toBeGreaterThan(0)
  expect(calls.fillRect ?? 0).toBe(0)

  runShuffle()
  act(() => vi.advanceTimersByTime(300))
  nextFrame()
  expect(calls.fillRect).toBeGreaterThan(0)

  const pending = callbacks.length
  unmount()
  expect(cancelAnimationFrame).toHaveBeenCalledWith(pending)
})

test('the effects loop ends by itself once the confetti and the snow are over', () => {
  const { callbacks, nextFrame } = fakeCanvas()
  renderModal({ names: ['Ana', 'Bea', 'Carlos'], receiver: 'Bea' })
  nextFrame()
  runShuffle()
  act(() => vi.advanceTimersByTime(300))

  let frames = 0
  for (let requested = callbacks.length; frames < 2000; frames++) {
    nextFrame()
    if (callbacks.length === requested) break
    requested = callbacks.length
  }
  expect(frames).toBeLessThan(2000)
  // La nieve sigue cayendo un buen rato después de la revelación
  expect(frames * 50).toBeGreaterThan(10000)
})
