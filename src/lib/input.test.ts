import { describe, expect, it } from 'vitest'

import { MAX_CAPTURE_AGE_MS, parseCapturedAt } from './input'

describe('parseCapturedAt (offline queue capture time)', () => {
  const now = Date.parse('2026-11-28T08:00:00.000Z')

  it('is optional', () => {
    expect(parseCapturedAt(undefined, now)).toEqual({ ok: true, value: undefined })
  })

  it('accepts a past ISO time and normalises it', () => {
    expect(parseCapturedAt('2026-11-28T14:30:00+07:00', now)).toEqual({ ok: true, value: '2026-11-28T07:30:00.000Z' })
  })

  it('clamps a time in the future to now (phone clocks drift)', () => {
    expect(parseCapturedAt('2026-11-28T09:00:00.000Z', now)).toEqual({ ok: true, value: '2026-11-28T08:00:00.000Z' })
  })

  it('refuses garbage and times older than a day of event', () => {
    expect(parseCapturedAt('yesterday', now).ok).toBe(false)
    expect(parseCapturedAt('2026-11-28', now).ok).toBe(false)
    expect(parseCapturedAt('2026-13-45T99:00:00Z', now).ok).toBe(false)
    expect(parseCapturedAt(new Date(now - MAX_CAPTURE_AGE_MS - 1000).toISOString(), now).ok).toBe(false)
  })
})
