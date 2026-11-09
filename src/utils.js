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

// El nombre visible conserva mayúsculas; el id de reserva hace que "Familia" y " familia " coincidan.
// El id es el UTF-8 en hexadecimal: siempre es un id de documento válido, sea cual sea el nombre.
export function normalizeGroupName(rawName) {
  const name = rawName.trim().replace(/\s+/g, ' ')
  const bytes = new TextEncoder().encode(name.normalize('NFC').toLowerCase())
  const nameId = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  return { name, nameId }
}

export function validateGroupName(rawName) {
  const { name } = normalizeGroupName(rawName)
  if (!name) return 'Escribe un nombre para el grupo.'
  if (name.length > 100) return 'El nombre del grupo no puede tener más de 100 caracteres.'
  return null
}

const AUTH_ERRORS = {
  'auth/user-not-found': 'Este email no tiene una cuenta en esta app, ¡Regístrate!',
  'auth/wrong-password': 'La contraseña no es correcta.',
  'auth/invalid-credential': 'El email o la contraseña no son correctos.',
  'auth/network-request-failed': 'No se ha podido conectar con el sistema, comprueba tu conexión a Internet.',
  'auth/invalid-email': 'Dirección de email no válida.',
  'auth/email-already-in-use': 'Ya existe una cuenta con este email.',
}

export function authErrorMessage(error) {
  return AUTH_ERRORS[error.code] ?? `Error: ${error.message} Código del error: ${error.code}`
}
