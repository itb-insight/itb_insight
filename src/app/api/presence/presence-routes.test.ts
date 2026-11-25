// Booth presence and pending-feedback routes: consent, feature switches, rate limit, and that a
// ping stores only which booth (never coordinates).

import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDb, writesTo, type FakeCall, type FakeDb, type FakeResult } from '../../../../tests/support/fake-supabase'

const state = vi.hoisted(() => ({
  db: undefined as unknown as FakeDb,
  user: null as null | { id: string; email: string },
  admin: false,
}))

vi.mock('next/cache', () => ({ unstable_cache: (fn: () => unknown) => fn }))
vi.mock('@/lib/supabase/server', async () => {
  const { createFakeClient } = await import('../../../../tests/support/fake-supabase')
  return { createServiceClient: () => createFakeClient(state.db), createClient: async () => createFakeClient(state.db) }
})
vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: async () =>
    state.user ? { ok: true, user: state.user } : { ok: false, code: 'UNAUTHORIZED', message: 'no', status: 401 },
}))
vi.mock('@/lib/admin', () => ({ isAdminUser: async () => state.admin }))

const ping = await import('./ping/route')
const consent = await import('./consent/route')
const config = await import('./config/route')
const pending = await import('../feedback/pending/route')

const VENUE = { lat: -6.8915, lng: 107.6107 }
const BOOTH = { id: 'booth-1', name: 'Robotics', lat: VENUE.lat + 0.0005, lng: VENUE.lng, presence_radius_m: 15 }
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

let ipCounter = 0
const request = (path: string, method = 'GET', body?: unknown, headers: Record<string, string> = {}) =>
  new NextRequest(`https://insight.test${path}`, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    headers: { 'content-type': 'application/json', 'x-real-ip': `198.51.100.${(ipCounter += 1) % 250}`, ...headers },
  })
const fixAt = (dLat: number, accuracy = 8) => ({ lat: VENUE.lat + dLat, lng: VENUE.lng, accuracy })

type Tables = Record<string, (call: FakeCall) => FakeResult>
function useDb(tables: Tables) {
  state.db = createFakeDb((call) => tables[call.table]?.(call) ?? { data: null, error: null, count: 0 })
}

const consented: Tables = {
  profiles: () => ({ data: { presence_consent_at: '2026-11-28T01:00:00Z' }, error: null }),
  booths: () => ({ data: [BOOTH], error: null }),
  'rpc:record_booth_presence': () => ({ data: [{ visit_id: 'v1', dwell_seconds: 120 }], error: null }),
}

beforeEach(() => {
  vi.stubEnv('VENUE_LAT', String(VENUE.lat))
  vi.stubEnv('VENUE_LNG', String(VENUE.lng))
  vi.stubEnv('PRESENCE_DATES', today())
  vi.stubEnv('PRESENCE_HOURS', '0-24')
  vi.stubEnv('PRESENCE_BURST', '')
  state.user = { id: `user-${Math.random()}`, email: 'Visitor@Example.com' }
  state.admin = false
  useDb(consented)
})

afterEach(() => vi.unstubAllEnvs())

describe('POST /api/presence/ping', () => {
  it('requires sign-in', async () => {
    state.user = null
    expect((await ping.POST(request('/api/presence/ping', 'POST', { fixes: [fixAt(0)] }))).status).toBe(401)
  })

  it('is off (503) until the venue is configured', async () => {
    vi.stubEnv('VENUE_LAT', '')
    const res = await ping.POST(request('/api/presence/ping', 'POST', { fixes: [fixAt(0)] }))
    expect(res.status).toBe(503)
    expect(state.db.calls).toEqual([])
  })

  it('refuses outside presence days and without consent, recording nothing', async () => {
    vi.stubEnv('PRESENCE_DATES', '2000-01-01')
    expect((await (await ping.POST(request('/api/presence/ping', 'POST', { fixes: [fixAt(0)] }))).json()).error.code).toBe('PRESENCE_CLOSED')

    vi.stubEnv('PRESENCE_DATES', today())
    useDb({ ...consented, profiles: () => ({ data: { presence_consent_at: null }, error: null }) })
    const res = await ping.POST(request('/api/presence/ping', 'POST', { fixes: [fixAt(0)] }))
    expect(res.status).toBe(403)
    expect((await res.json()).error.code).toBe('CONSENT_REQUIRED')
    expect(state.db.calls.some((call) => call.table.startsWith('rpc:'))).toBe(false)
  })

  it('records nothing outside the event zone', async () => {
    const res = await ping.POST(request('/api/presence/ping', 'POST', { fixes: [fixAt(0.01)] })) // ~1.1 km
    expect((await res.json()).data).toMatchObject({ insideVenue: false, booth: null })
    expect(state.db.calls.some((call) => call.table.startsWith('rpc:'))).toBe(false)
  })

  it('records the matched booth by id only, never coordinates', async () => {
    const res = await ping.POST(request('/api/presence/ping', 'POST', { fixes: [fixAt(0.0005)] }))
    const { data } = await res.json()
    expect(data).toMatchObject({ insideVenue: true, booth: { id: 'booth-1', name: 'Robotics' }, dwellSeconds: 120, visitMinSeconds: 300 })

    const rpc = state.db.calls.find((call) => call.table === 'rpc:record_booth_presence')!
    expect(rpc.payload).toEqual({ p_user: state.user!.id, p_booth: 'booth-1' })
  })

  it('records venue time (no booth) for an imprecise fix inside the venue', async () => {
    await ping.POST(request('/api/presence/ping', 'POST', { fixes: [fixAt(0.0005, 60)] }))
    const rpc = state.db.calls.find((call) => call.table === 'rpc:record_booth_presence')!
    expect(rpc.payload).toEqual({ p_user: state.user!.id, p_booth: null })
  })

  it('uses only the last fix unless burst sampling is on', async () => {
    const burst = { fixes: [fixAt(0.01), fixAt(0.0005)] }
    const single = await (await ping.POST(request('/api/presence/ping', 'POST', burst))).json()
    expect(single.data.fixes).toMatchObject({ received: 1 })

    vi.stubEnv('PRESENCE_BURST', 'true')
    const many = await (await ping.POST(request('/api/presence/ping', 'POST', { fixes: Array(10).fill(fixAt(0.0005)) }))).json()
    expect(many.data.fixes).toMatchObject({ received: 8, used: 8 })
  })

  it('rejects junk bodies and rate limits a user to a few pings a minute', async () => {
    expect((await ping.POST(request('/api/presence/ping', 'POST', { fixes: [{ lat: 'x' }] }))).status).toBe(400)

    const statuses = []
    for (let i = 0; i < 5; i += 1) {
      statuses.push((await ping.POST(request('/api/presence/ping', 'POST', { fixes: [fixAt(0)] }))).status)
    }
    expect(statuses.at(-1)).toBe(429)
  })
})

describe('/api/presence/consent', () => {
  it('stores consent on the profile, through the server only', async () => {
    const res = await consent.POST(request('/api/presence/consent', 'POST'))
    expect(res.status).toBe(200)
    const [write] = writesTo(state.db, 'profiles')
    expect(Object.keys(write.payload as object)).toEqual(['presence_consent_at'])
  })

  it('withdrawing clears consent and deletes every presence row of the user', async () => {
    const res = await consent.DELETE(request('/api/presence/consent', 'DELETE'))
    expect(res.status).toBe(200)
    expect(writesTo(state.db, 'profiles')[0].payload).toEqual({ presence_consent_at: null })
    const [deleted] = writesTo(state.db, 'booth_presence')
    expect(deleted.op).toBe('delete')
    expect(deleted.filters).toContainEqual({ method: 'eq', args: ['user_id', state.user!.id] })
  })
})

describe('GET /api/presence/config', () => {
  it('says disabled without a venue', async () => {
    vi.stubEnv('VENUE_LAT', '')
    expect((await (await config.GET(request('/api/presence/config'))).json()).data).toEqual({ enabled: false })
  })

  it('offers the opt-in card after a gate check-in today or from a Bandung IP', async () => {
    useDb({ ...consented, profiles: () => ({ data: { presence_consent_at: null }, error: null }) })
    const far = (await (await config.GET(request('/api/presence/config'))).json()).data
    expect(far).toMatchObject({ enabled: true, open: true, consented: false, promptEligible: false, debug: false })

    const bandung = (await (await config.GET(request('/api/presence/config', 'GET', undefined, { 'x-vercel-ip-city': 'Bandung' }))).json()).data
    expect(bandung.promptEligible).toBe(true)

    useDb({ ...consented, gate_check_ins: () => ({ data: null, error: null, count: 1 }) })
    expect((await (await config.GET(request('/api/presence/config'))).json()).data).toMatchObject({ consented: true, promptEligible: true })
  })
})

describe('GET /api/feedback/pending', () => {
  const form = (slug: string, opensAt: string | null, closesAt: string | null) => ({
    id: `id-${slug}`,
    slug,
    title: slug.toUpperCase(),
    description: null,
    context: 'event',
    questions: [{ id: 'overall', label: 'Overall', type: 'stars', overall: true }],
    opens_at: opensAt,
    closes_at: closesAt,
    is_active: true,
    pii_retention_days: 180,
  })
  const hour = 60 * 60_000
  const iso = (offset: number) => new Date(Date.now() + offset).toISOString()

  it('lists open forms the attendee has not submitted, and when the next one opens', async () => {
    useDb({
      feedback_forms: () => ({
        data: [form('open-a', iso(-hour), iso(hour)), form('open-b', iso(-hour), null), form('later', iso(2 * hour), null)],
        error: null,
      }),
      gate_check_ins: () => ({ data: null, error: null, count: 1 }),
      feedback_submissions: (call) =>
        call.filters.some((filter) => filter.args[0] === 'email' && filter.args[1] === 'visitor@example.com')
          ? { data: [{ form_id: 'id-open-b' }], error: null }
          : { data: [], error: null },
    })

    const { data } = await (await pending.GET(request('/api/feedback/pending'))).json()
    expect(data.pending).toEqual([{ slug: 'open-a', title: 'OPEN-A' }])
    expect(Math.abs(new Date(data.nextCheckAt).getTime() - (Date.now() + 2 * hour))).toBeLessThan(5_000)
  })

  it('asks nobody who never checked in', async () => {
    useDb({
      feedback_forms: () => ({ data: [form('open-a', iso(-hour), null)], error: null }),
      gate_check_ins: () => ({ data: null, error: null, count: 0 }),
    })
    const { data } = await (await pending.GET(request('/api/feedback/pending'))).json()
    expect(data.pending).toEqual([])
  })
})
