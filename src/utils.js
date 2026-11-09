export const DEFAULT_WISH = '¡Cualquier cosa!'

export const GENERIC_ERROR = 'No se ha podido completar la operación, comprueba tu conexión e inténtalo de nuevo.'

// Fisher-Yates con rechazo: uniforme entre todas las asignaciones donde nadie se regala a sí mismo
export function createDerangement(items, random = Math.random) {
  if (items.length < 2 || new Set(items).size !== items.length) {
    throw new Error('Se necesitan al menos dos participantes distintos.')
  }
  for (;;) {
    const result = [...items]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    if (result.every((item, i) => item !== items[i])) return result
  }
}

const ZERO_WIDTH = /[\u200B-\u200D\u2060\uFEFF]/g

// El nombre visible conserva mayúsculas; el id de reserva hace que "Familia" y " familia " coincidan.
// El id es el UTF-8 en hexadecimal del nombre en minúsculas: siempre es un id de documento válido.
// firestore.rules solo comprueba el formato, porque su lower() únicamente convierte A-Z.
export function normalizeGroupName(rawName) {
  const name = rawName.normalize('NFC').replace(ZERO_WIDTH, '').trim().replace(/\s+/g, ' ')
  const bytes = new TextEncoder().encode(name.toLowerCase())
  const nameId = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  return { name, nameId }
}

// Búsqueda insensible a mayúsculas, espacios repetidos y tildes
export function normalizeSearch(term) {
  return term.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLowerCase()
}

// Los grupos creados por la versión antigua no tienen "name" y se ignoran
export function toGroupList(docs) {
  return docs
    .map(d => {
      const { name, admin, shuffleStage } = d.data()
      return { id: d.id, name, admin, shuffleStage }
    })
    .filter(group => typeof group.name === 'string')
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

export function validateGroupName(rawName) {
  const { name } = normalizeGroupName(rawName)
  if (!name) return 'Escribe un nombre para el grupo.'
  if (name.length > 100) return 'El nombre del grupo no puede tener más de 100 caracteres.'
  return null
}

// Un único mensaje para los errores de credenciales: no revela si el email tiene cuenta
const WRONG_CREDENTIALS = 'El email o la contraseña no son correctos.'

const AUTH_ERRORS = {
  'auth/user-not-found': WRONG_CREDENTIALS,
  'auth/wrong-password': WRONG_CREDENTIALS,
  'auth/invalid-credential': WRONG_CREDENTIALS,
  'auth/invalid-login-credentials': WRONG_CREDENTIALS,
  'auth/invalid-email': 'Dirección de email no válida.',
  'auth/missing-email': 'Escribe tu email.',
  'auth/missing-password': 'Escribe tu contraseña.',
  'auth/email-already-in-use': 'Ya existe una cuenta con este email.',
  'auth/weak-password': 'La contraseña es demasiado débil, usa al menos 8 caracteres.',
  'auth/password-does-not-meet-requirements': 'La contraseña no cumple los requisitos de seguridad, prueba con una más larga que combine letras y números.',
  'auth/too-many-requests': 'Has hecho demasiados intentos seguidos, espera unos minutos y vuelve a intentarlo.',
  'auth/user-disabled': 'Esta cuenta está desactivada.',
  'auth/network-request-failed': 'No se ha podido conectar con el sistema, comprueba tu conexión a Internet.',
}

export const AUTH_GENERIC_ERROR = 'No se ha podido completar la operación. Inténtalo de nuevo más tarde.'

export function authErrorMessage(error) {
  return AUTH_ERRORS[error?.code] ?? AUTH_GENERIC_ERROR
}
