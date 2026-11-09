import { describe, expect, it } from 'vitest'
import { parseRoute } from './routing'

describe('parseRoute', () => {
  it('reads a group id from an invite link', () => {
    expect(parseRoute('#/grupo/abc123')).toEqual({ name: 'group', path: '/grupo/abc123', groupId: 'abc123' })
  })

  it('falls back to home instead of crashing on a malformed hand-typed link', () => {
    expect(parseRoute('#/grupo/%E0%A4%A')).toEqual({ name: 'home' })
  })
})
