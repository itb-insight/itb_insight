import { afterEach, describe, expect, it, vi } from 'vitest'

import { isRegistrationOpen } from './team-registration'
import { generateTeamUid, isValidTeamUid, normalizeTeamUid } from './teams'

describe('team UID (the only secret needed to join a team)', () => {
  it('is PREFIX-XXXXXX with an uppercase alphanumeric code', () => {
    for (let i = 0; i < 200; i += 1) {
      const uid = generateTeamUid('sar')
      expect(uid).toMatch(/^SAR-[A-Z0-9]{6}$/)
      expect(isValidTeamUid(uid, 'SAR')).toBe(true)
    }
  })

  it('does not repeat across many teams', () => {
    const uids = new Set(Array.from({ length: 2000 }, () => generateTeamUid('BPC')))
    expect(uids.size).toBe(2000)
  })

  it('normalizes what members type', () => {
    expect(normalizeTeamUid('  bpc-4k9 f2a ')).toBe('BPC-4K9F2A')
    expect(isValidTeamUid(' bpc-4k9f2a ', 'BPC')).toBe(true)
  })

  it('rejects other prefixes, lengths and characters', () => {
    expect(isValidTeamUid('SAR-4K9F2A', 'BPC')).toBe(false)
    expect(isValidTeamUid('BPC-4K9F2', 'BPC')).toBe(false)
    expect(isValidTeamUid('BPC-4K9F2AB', 'BPC')).toBe(false)
    expect(isValidTeamUid('BPC-4K9F2_', 'BPC')).toBe(false)
    expect(isValidTeamUid('XBPC-4K9F2A', 'BPC')).toBe(false)
  })
})

describe('isRegistrationOpen', () => {
  afterEach(() => vi.useRealTimers())

  it('is open with no window, and inside the window', () => {
    vi.useFakeTimers({ now: new Date('2026-10-01T00:00:00Z') })
    expect(isRegistrationOpen(null, null)).toBe(true)
    expect(isRegistrationOpen('2026-09-23T00:00:00Z', '2026-10-11T23:59:59Z')).toBe(true)
  })

  it('is closed before opening and after closing', () => {
    vi.useFakeTimers({ now: new Date('2026-10-12T00:00:00Z') })
    expect(isRegistrationOpen('2026-09-23T00:00:00Z', '2026-10-11T23:59:59Z')).toBe(false)
    expect(isRegistrationOpen('2026-11-01T00:00:00Z', null)).toBe(false)
  })

  it('fails closed on an unparseable date', () => {
    expect(isRegistrationOpen('not a date', null)).toBe(false)
    expect(isRegistrationOpen(null, 'soon')).toBe(false)
  })
})
