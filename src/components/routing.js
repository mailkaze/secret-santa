import { useMemo, useSyncExternalStore } from 'react'

// La pantalla actual sale solo del hash: #/, #/entrar, #/registro y #/grupo/{id}
const GROUP_PATH = /^\/grupo\/([^/?#]+)$/

export function groupPath(groupId) {
  return `/grupo/${encodeURIComponent(groupId)}`
}

// Solo se vuelve a rutas internas conocidas; cualquier otra cosa lleva al inicio
function safeReturn(path) {
  return path && GROUP_PATH.test(path) ? path : '/'
}

export function parseRoute(hash) {
  const [path, query = ''] = hash.replace(/^#/, '').split('?')
  const returnTo = safeReturn(new URLSearchParams(query).get('volver'))
  const groupMatch = path.match(GROUP_PATH)
  if (groupMatch) return { name: 'group', path, groupId: decodeURIComponent(groupMatch[1]) }
  if (path === '/entrar') return { name: 'login', returnTo }
  if (path === '/registro') return { name: 'signup', returnTo }
  return { name: 'home' }
}

// Enlace a entrar o registrarse que, al terminar, vuelve a returnTo
export function authHref(path, returnTo) {
  return returnTo && returnTo !== '/' ? `#${path}?volver=${encodeURIComponent(returnTo)}` : `#${path}`
}

export function navigate(path, { replace = false } = {}) {
  if (window.location.hash === `#${path}`) return
  if (replace) {
    window.history.replaceState(null, '', `#${path}`)
    window.dispatchEvent(new Event('hashchange'))
  } else {
    window.location.hash = path
  }
}

function subscribe(onChange) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

function getHash() {
  return window.location.hash
}

export function useRoute() {
  const hash = useSyncExternalStore(subscribe, getHash)
  return useMemo(() => parseRoute(hash), [hash])
}
