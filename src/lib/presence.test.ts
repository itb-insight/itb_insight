import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({ unstable_cache: (fn: () => unknown) => fn }))
vi.mock('@/lib/admin', () => ({ getUserRole: async () => null }))

const { getPresenceSettings, isPresenceOpen, isPresenceTesterRole, nearBandung, presenceDays, startOfJakartaDay } = await import(
  './presence'
)

afterEach(() => vi.unstubAllEnvs())

describe('presence settings', () => {
  it('is off without a venue; the booth zone needs all three values', () => {
    vi.stubEnv('VENUE_LAT', '')
    expect(getPresenceSettings()).toBeNull()

    vi.stubEnv('VENUE_LAT', '-6.8915')
    vi.stubEnv('VENUE_LNG', '107.6107')
    vi.stubEnv('BOOTH_ZONE_LAT', '-6.891')
    vi.stubEnv('BOOTH_ZONE_LNG', '107.61')
    expect(getPresenceSettings()).toMatchObject({ boothZone: null, boothMaxAccuracyM: 25, burst: false })

    vi.stubEnv('BOOTH_ZONE_RADIUS_M', '60')
    vi.stubEnv('PRESENCE_BURST', 'true')
    expect(getPresenceSettings()).toMatchObject({ boothZone: { lat: -6.891, lng: 107.61, radiusM: 60 }, burst: true })
  })

  it('runs only on presence days, inside presence hours (Jakarta)', async () => {
    vi.stubEnv('PRESENCE_DATES', '2026-11-28, junk')
    vi.stubEnv('PRESENCE_HOURS', '7-22')
    expect(await presenceDays()).toEqual(new Set(['2026-11-28']))

    expect(await isPresenceOpen(new Date('2026-11-28T01:00:00Z'))).toBe(true) // 08:00 WIB
    expect(await isPresenceOpen(new Date('2026-11-27T23:30:00Z'))).toBe(false) // 06:30 WIB
    expect(await isPresenceOpen(new Date('2026-11-28T15:00:00Z'))).toBe(false) // 22:00 WIB
    expect(await isPresenceOpen(new Date('2026-11-29T01:00:00Z'))).toBe(false) // next day
  })

  it('defaults to D-Day when no dates are configured', async () => {
    vi.stubEnv('PRESENCE_DATES', '')
    expect((await presenceDays()).has('2026-11-28')).toBe(true)
  })

  it('test mode covers admin and staff roles only, and only when switched on', () => {
    expect(isPresenceTesterRole('admin')).toBe(false)
    vi.stubEnv('PRESENCE_TEST_MODE', 'true')
    for (const role of ['admin', 'field_staff', 'gate_staff', 'booth_staff'] as const) expect(isPresenceTesterRole(role)).toBe(true)
    expect(isPresenceTesterRole('exhibitor')).toBe(false)
    expect(isPresenceTesterRole(null)).toBe(false)
    vi.stubEnv('PRESENCE_TEST_MODE', '1')
    expect(isPresenceTesterRole('admin')).toBe(false)
  })

  it('starts the day at midnight Jakarta time', () => {
    expect(startOfJakartaDay(new Date('2026-11-27T18:00:00Z'))).toBe('2026-11-27T17:00:00.000Z')
  })

  it('reads Vercel IP city, URL-encoded', () => {
    expect(nearBandung(new Headers({ 'x-vercel-ip-city': 'Bandung' }))).toBe(true)
    expect(nearBandung(new Headers({ 'x-vercel-ip-city': 'Kota%20Cimahi' }))).toBe(true)
    expect(nearBandung(new Headers({ 'x-vercel-ip-city': 'Jakarta' }))).toBe(false)
    expect(nearBandung(new Headers())).toBe(false)
  })
})
