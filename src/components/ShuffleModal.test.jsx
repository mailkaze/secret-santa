import { StrictMode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import AppProviders from './AppProviders'
import { createAppStore } from '../redux/store'
import ShuffleModal from './ShuffleModal'

let consoleError

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error')
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  expect(consoleError).not.toHaveBeenCalled()
  consoleError.mockRestore()
  delete window.matchMedia
})

function renderModal(props) {
  const onClose = vi.fn()
  render(
    <StrictMode>
      <AppProviders store={createAppStore()}>
        <ShuffleModal open onClose={onClose} {...props} />
      </AppProviders>
    </StrictMode>
  )
  return onClose
}

const shownName = () => screen.getByTestId('shuffle-name').textContent

// Avanza el reloj paso a paso (cada paso programa el siguiente al renderizar) y devuelve los nombres vistos
function runShuffle() {
  const seen = [shownName()]
  for (let i = 0; i < 100 && screen.getByRole('status').textContent === ''; i++) {
    act(() => vi.advanceTimersByTime(400))
    seen.push(shownName())
  }
  return seen
}

test('shuffles names with timers, never starts on the receiver and ends on it', () => {
  const names = ['Ana', 'Bea', 'Carlos', 'Dani', 'Eva', 'Fran', 'Gloria', 'Hugo', 'Inés', 'Juan', 'Kike', 'Lola']
  renderModal({ names, receiver: 'Bea' })
  expect(screen.getByRole('status')).toHaveTextContent('')
  expect(screen.getByRole('button', { name: 'Ver de nuevo' })).toBeDisabled()

  const seen = runShuffle()
  expect(seen[0]).not.toBe('Bea')
  expect(seen.at(-1)).toBe('Bea')
  expect(seen.at(-2)).not.toBe('Bea')
  expect(new Set(seen)).toEqual(new Set(names))
  expect(screen.getByRole('status')).toHaveTextContent('Te toca regalar a Bea.')
  expect(screen.getByRole('button', { name: 'Ver de nuevo' })).toBeEnabled()

  fireEvent.click(screen.getByRole('button', { name: 'Ver de nuevo' }))
  expect(shownName()).not.toBe('Bea')
  expect(screen.getByRole('status')).toHaveTextContent('')
  expect(runShuffle().at(-1)).toBe('Bea')
})

test('works with a group of two', () => {
  renderModal({ names: ['Ana', 'Bea'], receiver: 'Bea' })
  const seen = runShuffle()
  expect(seen[0]).toBe('Ana')
  expect(seen.length).toBeGreaterThan(5)
  expect(seen.at(-1)).toBe('Bea')
  expect(seen.at(-2)).toBe('Ana')
})

test('shows the result at once when the user prefers reduced motion', () => {
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
  renderModal({ names: ['Ana', 'Bea', 'Carlos'], receiver: 'Carlos' })
  expect(shownName()).toBe('Carlos')
  expect(screen.getByRole('status')).toHaveTextContent('Te toca regalar a Carlos.')
  expect(screen.getByRole('button', { name: 'Ver de nuevo' })).toBeEnabled()
})

test('closes from its button', () => {
  const onClose = renderModal({ names: ['Ana', 'Bea'], receiver: 'Bea' })
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
  expect(onClose).toHaveBeenCalled()
})
