import { describe, expect, it } from 'vitest'
import {
  authErrorMessage,
  createDerangement,
  normalizeGroupName,
  normalizeSearch,
  toGroupList,
  validateGroupName,
} from './utils'

describe('toGroupList', () => {
  const snapshot = (id, data) => ({ id, data: () => data })

  it('ignores documents from the old app that have no name and sorts the rest by name', () => {
    const docs = [
      snapshot('Familia antigua', { admin: 'ana', users: ['ana'] }),
      snapshot('g2', { name: 'Zapatos', users: ['ana'] }),
      snapshot('g1', { name: 'Amigos', users: ['ana'] }),
    ]
    expect(toGroupList(docs).map(g => g.id)).toEqual(['g1', 'g2'])
  })

  it('keeps the admin and the draw stage so the list can show role and status', () => {
    const docs = [snapshot('g1', { name: 'Amigos', admin: 'ana', users: ['ana'], shuffleStage: true })]
    expect(toGroupList(docs)).toEqual([{ id: 'g1', name: 'Amigos', admin: 'ana', shuffleStage: true }])
  })
})

describe('createDerangement', () => {
  const uids = ['ana', 'bea', 'carlos', 'dani']

  it('returns a permutation where nobody gets themselves', () => {
    for (let run = 0; run < 500; run++) {
      const receivers = createDerangement(uids)
      expect([...receivers].sort()).toEqual([...uids].sort())
      receivers.forEach((receiver, i) => expect(receiver).not.toBe(uids[i]))
    }
  })

  it('reaches every derangement with a similar frequency', () => {
    // 4 personas tienen exactamente 9 desarreglos posibles
    const counts = new Map()
    const runs = 9000
    for (let run = 0; run < runs; run++) {
      const key = createDerangement(uids).join(',')
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    expect(counts.size).toBe(9)
    counts.forEach(count => expect(count).toBeGreaterThan(runs / 9 * 0.8))
  })

  it('works with two people', () => {
    expect(createDerangement(['ana', 'bea'])).toEqual(['bea', 'ana'])
  })

  it('rejects fewer than two people or repeated people', () => {
    expect(() => createDerangement(['ana'])).toThrow()
    expect(() => createDerangement(['ana', 'ana'])).toThrow()
  })
})

describe('normalizeGroupName', () => {
  it('trims and collapses whitespace for the display name', () => {
    expect(normalizeGroupName('  Familia   García ').name).toBe('Familia García')
  })

  it('gives the same id to names that only differ in case or spaces', () => {
    const a = normalizeGroupName('Familia García')
    const b = normalizeGroupName('  familia   GARCÍA ')
    expect(a.nameId).toBe(b.nameId)
  })

  it('produces a document id with only hexadecimal characters', () => {
    for (const name of ['Amigos 2025/2026', '.', '..', '__grupo__', 'Año nuevo 🎄']) {
      expect(normalizeGroupName(name).nameId).toMatch(/^[0-9a-f]+$/)
    }
  })

  it('gives different ids to different names', () => {
    expect(normalizeGroupName('José').nameId).not.toBe(normalizeGroupName('Jose').nameId)
  })

  it('stores the name NFC-normalised so composed and decomposed accents are the same group', () => {
    const decomposed = 'Jose\u0301 Pen\u0303a'
    const { name, nameId } = normalizeGroupName(decomposed)
    expect(name).toBe('José Peña')
    expect(nameId).toBe(normalizeGroupName('José Peña').nameId)
  })

  it('removes zero-width characters from the name and the id', () => {
    const { name, nameId } = normalizeGroupName('\uFEFFFa\u200Bmi\u200Clia\u200D \u2060García')
    expect(name).toBe('Familia García')
    expect(nameId).toBe(normalizeGroupName('Familia García').nameId)
  })

  it('computes the id from the stored name: lowercase, UTF-8, hexadecimal', () => {
    const { name, nameId } = normalizeGroupName('Año Ñ 🎄')
    const expected = Array.from(new TextEncoder().encode(name.toLowerCase()), byte => byte.toString(16).padStart(2, '0')).join('')
    expect(nameId).toBe(expected)
  })
})

describe('validateGroupName', () => {
  it('accepts a normal name', () => {
    expect(validateGroupName('Familia García')).toBeNull()
  })

  it('accepts names with dots, slashes or brackets', () => {
    expect(validateGroupName('Amigos 2025/2026 [cole] v1.0')).toBeNull()
  })

  it('rejects empty names', () => {
    expect(validateGroupName('   ')).toBe('Escribe un nombre para el grupo.')
  })

  it('rejects names longer than 100 characters', () => {
    expect(validateGroupName('a'.repeat(101))).toBe('El nombre del grupo no puede tener más de 100 caracteres.')
  })

  it('accepts names that would be invalid as raw Firestore ids', () => {
    for (const name of ['.', '..', '__grupo__']) {
      expect(validateGroupName(name)).toBeNull()
    }
  })
})

describe('normalizeSearch', () => {
  it('trims, collapses spaces and lowercases', () => {
    expect(normalizeSearch('  Familia   GARCÍA ')).toBe('familia garcia')
  })

  it('strips diacritics so accents do not matter', () => {
    expect(normalizeSearch('Árbol de Navidad, niños y pingüinos')).toBe('arbol de navidad, ninos y pinguinos')
    expect(normalizeSearch('Jose\u0301')).toBe(normalizeSearch('José'))
  })

  it('returns an empty string for blank input', () => {
    expect(normalizeSearch('   ')).toBe('')
  })
})

describe('authErrorMessage', () => {
  it('uses one generic message for every credential error so emails cannot be enumerated', () => {
    for (const code of ['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential']) {
      expect(authErrorMessage({ code })).toBe('El email o la contraseña no son correctos.')
    }
  })

  it('translates other common Firebase error codes to Spanish', () => {
    expect(authErrorMessage({ code: 'auth/invalid-email' })).toBe('Dirección de email no válida.')
    expect(authErrorMessage({ code: 'auth/email-already-in-use' })).toBe('Ya existe una cuenta con este email.')
    expect(authErrorMessage({ code: 'auth/too-many-requests' })).toMatch(/demasiados intentos/i)
    expect(authErrorMessage({ code: 'auth/weak-password' })).toMatch(/contraseña/)
    expect(authErrorMessage({ code: 'auth/network-request-failed' })).toMatch(/conexión/)
  })

  it('falls back to a Spanish generic message without the raw English text or code', () => {
    const message = authErrorMessage({ code: 'auth/other', message: 'Firebase: Boom (auth/other).' })
    expect(message).toBe('No se ha podido completar la operación. Inténtalo de nuevo más tarde.')
    expect(authErrorMessage({})).toBe(message)
  })
})
