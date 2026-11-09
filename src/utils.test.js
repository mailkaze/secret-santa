import { describe, expect, it } from 'vitest'
import { authErrorMessage, createDerangement, normalizeGroupName, validateGroupName } from './utils'

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

describe('authErrorMessage', () => {
  it('translates known Firebase error codes', () => {
    expect(authErrorMessage({ code: 'auth/invalid-email' })).toBe('Dirección de email no válida.')
    expect(authErrorMessage({ code: 'auth/invalid-credential' })).toBe('El email o la contraseña no son correctos.')
  })

  it('falls back to the raw message and code', () => {
    expect(authErrorMessage({ code: 'auth/other', message: 'Boom.' })).toBe('Error: Boom. Código del error: auth/other')
  })
})
