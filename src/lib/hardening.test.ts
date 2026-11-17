// Unit tests for the small hardening helpers: client IPs, geofence, PostgREST escaping,
// JSON-LD escaping, body parsing, and the registration switch.

import { afterEach, describe, expect, it, vi } from 'vitest'

import { clientIpFromHeaders, isCloudflareIp } from './client-ip'
import { isRegistrationSwitchOn } from './competitions'
import { checkWithinVenue, distanceM, getVenue, parseFix } from './geofence'
import { parseTextFields } from './input'
import { jsonLd } from './json-ld'
import { escapeLike, ilikeAnyFilter } from './postgrest'

afterEach(() => vi.unstubAllEnvs())

const headers = (values: Record<string, string>) => new Headers(values)

describe('client IP', () => {
  it('recognizes Cloudflare edge addresses, v4 and v6', () => {
    expect(isCloudflareIp('104.16.0.1')).toBe(true)
    expect(isCloudflareIp('172.71.255.255')).toBe(true)
    expect(isCloudflareIp('2a06:98c7::1')).toBe(true)
    expect(isCloudflareIp('8.8.8.8')).toBe(false)
    expect(isCloudflareIp('172.80.0.1')).toBe(false)
    expect(isCloudflareIp('2001:4860::8888')).toBe(false)
    expect(isCloudflareIp('not-an-ip')).toBe(false)
  })

  it('a client cannot pick its own rate-limit bucket by sending cf-connecting-ip', () => {
    const ips = new Set(
      Array.from({ length: 20 }, (_, i) =>
        clientIpFromHeaders(headers({ 'cf-connecting-ip': `10.0.0.${i}`, 'x-real-ip': '203.0.113.7' })),
      ),
    )
    expect([...ips]).toEqual(['203.0.113.7'])
  })
})

describe('geofence (self check-in)', () => {
  const ITB = { lat: -6.8915, lng: 107.6107 }

  it('is disabled until the venue is configured', () => {
    expect(getVenue()).toBeNull()
    vi.stubEnv('VENUE_LAT', '-6.8915')
    expect(getVenue()).toBeNull()
    vi.stubEnv('VENUE_LNG', 'not a number')
    expect(getVenue()).toBeNull()
    vi.stubEnv('VENUE_LNG', '107.6107')
    expect(getVenue()).toEqual({ ...ITB, radiusM: 300, maxAccuracyM: 100 })
  })

  it('measures distance in metres', () => {
    // 0.001 deg of latitude ≈ 111 m
    expect(distanceM(ITB, { lat: ITB.lat + 0.001, lng: ITB.lng })).toBeGreaterThan(105)
    expect(distanceM(ITB, { lat: ITB.lat + 0.001, lng: ITB.lng })).toBeLessThan(117)
  })

  it('accepts a precise fix inside the radius, rejects one outside or too imprecise', () => {
    const venue = { ...ITB, radiusM: 300, maxAccuracyM: 100 }
    expect(checkWithinVenue(venue, { ...ITB, accuracyM: 20 })).toMatchObject({ ok: true })
    // ~1.1 km away
    expect(checkWithinVenue(venue, { lat: ITB.lat + 0.01, lng: ITB.lng, accuracyM: 20 })).toMatchObject({
      ok: false,
      code: 'OUTSIDE_VENUE',
    })
    // A huge accuracy circle must not "reach" the venue from far away.
    expect(checkWithinVenue(venue, { lat: ITB.lat + 0.01, lng: ITB.lng, accuracyM: 5000 })).toMatchObject({
      ok: false,
      code: 'LOCATION_TOO_IMPRECISE',
    })
    // Just outside the edge, but within the fix's uncertainty: allowed.
    expect(checkWithinVenue(venue, { lat: ITB.lat + 0.0030, lng: ITB.lng, accuracyM: 60 })).toMatchObject({ ok: true })
  })

  it('parses only well-formed fixes', () => {
    expect(parseFix({ lat: -6.89, lng: 107.61, accuracy: 15 })).toEqual({ lat: -6.89, lng: 107.61, accuracyM: 15 })
    expect(parseFix({ lat: '-6.89', lng: 107.61, accuracy: 15 })).toBeNull()
    expect(parseFix({ lat: 91, lng: 0, accuracy: 1 })).toBeNull()
    expect(parseFix({ lat: 0, lng: 0, accuracy: -1 })).toBeNull()
    expect(parseFix(null)).toBeNull()
  })
})

describe('PostgREST filter building', () => {
  it('escapes LIKE wildcards', () => {
    expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\')
  })

  it('cannot add conditions or wildcards through the search term', () => {
    const filter = ilikeAnyFilter(['email', 'full_name'], 'a%,id.not.is.null),(role.eq.admin*')
    // Exactly two conditions, separated by the one comma we put in.
    expect(filter.split(',')).toHaveLength(2)
    expect(filter).not.toMatch(/[()*]/)
    expect(filter).toBe('email.ilike.%a\\% id.not.is.null role.eq.admin%,full_name.ilike.%a\\% id.not.is.null role.eq.admin%')
  })
})

describe('jsonLd', () => {
  it('cannot be broken out of with </script>', () => {
    const html = jsonLd({ name: '</script><script>alert(1)</script>' })
    expect(html).not.toContain('</script>')
    expect(JSON.parse(html)).toEqual({ name: '</script><script>alert(1)</script>' })
  })

  it('escapes the JS line separators', () => {
    const separators = String.fromCharCode(0x2028, 0x2029)
    const html = jsonLd({ text: separators })
    expect(html).toBe('{"text":"\\u2028\\u2029"}')
    expect(JSON.parse(html)).toEqual({ text: separators })
  })
})

describe('parseTextFields', () => {
  it('trims, drops blanks, and enforces limits and types', () => {
    expect(parseTextFields({ a: '  x  ', b: '   ', c: null }, { a: 5, b: 5, c: 5 })).toEqual({ ok: true, values: { a: 'x' } })
    expect(parseTextFields({ a: 123 }, { a: 5 })).toEqual({ ok: false, field: 'a' })
    expect(parseTextFields({ a: 'toolong' }, { a: 3 })).toEqual({ ok: false, field: 'a' })
    expect(parseTextFields('not an object', { a: 3 })).toEqual({ ok: true, values: {} })
  })
})

describe('isRegistrationSwitchOn (same switch as the Register button)', () => {
  it('is closed by default and opens per competition code', () => {
    expect(isRegistrationSwitchOn('microdrone-obstacle-race')).toBe(false)
    vi.stubEnv('REGISTER_OPEN_MOR', 'true')
    expect(isRegistrationSwitchOn('microdrone-obstacle-race')).toBe(true)
    expect(isRegistrationSwitchOn('business-plan-competition')).toBe(false)
    vi.stubEnv('REGISTER_OPEN_MOR', 'TRUE')
    expect(isRegistrationSwitchOn('microdrone-obstacle-race')).toBe(false)
  })

  it('is closed for unknown slugs', () => {
    vi.stubEnv('REGISTER_OPEN_undefined', 'true')
    expect(isRegistrationSwitchOn('nope')).toBe(false)
  })
})
