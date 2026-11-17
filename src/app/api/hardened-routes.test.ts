// Route-level checks for the patched endpoints: admin events auth, closed registration,
// geofenced self check-in, disabled partner inquiry, and the visitor search response shape.

import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDb, writesTo, type FakeDb } from '../../../tests/support/fake-supabase'

const state = vi.hoisted(() => ({
  db: undefined as unknown as FakeDb,
  user: null as null | { id: string; email: string; user_metadata: Record<string, unknown> },
  scoped: { ok: false, code: 'UNAUTHORIZED', message: 'no', status: 401 } as Record<string, unknown>,
}))

vi.mock('@/lib/supabase/server', async () => {
  const { createFakeClient } = await import('../../../tests/support/fake-supabase')
  return { createServiceClient: () => createFakeClient(state.db), createClient: async () => createFakeClient(state.db) }
})
vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: async () =>
    state.user ? { ok: true, user: state.user } : { ok: false, code: 'UNAUTHORIZED', message: 'no', status: 401 },
}))
vi.mock('@/lib/admin', () => ({ getScopedUser: async () => state.scoped }))

const adminEvents = await import('./admin/events/route')
const individual = await import('./registrations/individual/route')
const teams = await import('./teams/route')
const selfCheckIn = await import('./check-in/self/route')
const inquiry = await import('./partners/inquiry/route')
const manual = await import('./check-in/manual/route')

const post = (path: string, body: unknown) =>
  new NextRequest(`https://insight.test${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', 'x-real-ip': `198.51.100.${Math.floor(Math.random() * 250)}` },
  })

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://fake.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'fake')
  state.user = { id: 'user-1', email: 'u@example.com', user_metadata: {} }
  state.scoped = { ok: false, code: 'UNAUTHORIZED', message: 'no', status: 401 }
  state.db = createFakeDb(() => ({ data: null, error: null }))
})

afterEach(() => vi.unstubAllEnvs())

describe('GET /api/admin/events', () => {
  it('is no longer public', async () => {
    const res = await adminEvents.GET(new NextRequest('https://insight.test/api/admin/events'))
    expect(res.status).toBe(401)
  })

  it('answers admins', async () => {
    state.scoped = { ok: true, user: { id: 'admin' }, role: 'admin' }
    const res = await adminEvents.GET(new NextRequest('https://insight.test/api/admin/events?limit=5'))
    expect(res.status).toBe(200)
  })
})

describe('registration APIs obey REGISTER_OPEN_<code>', () => {
  it('reject a closed competition before touching the database', async () => {
    const res = await individual.POST(post('/api/registrations/individual', { competitionSlug: 'olimpiade-engineering' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error.code).toBe('REGISTRATION_CLOSED')

    const team = await teams.POST(post('/api/teams', { competitionSlug: 'microdrone-obstacle-race', teamName: 'T' }))
    expect((await team.json()).error.code).toBe('REGISTRATION_CLOSED')
    expect(state.db.calls).toEqual([])
  })

  it('reject non-string fields with 400 instead of crashing', async () => {
    vi.stubEnv('REGISTER_OPEN_OE', 'true')
    const res = await individual.POST(post('/api/registrations/individual', { competitionSlug: 'olimpiade-engineering', phoneNumber: 812 }))
    expect(res.status).toBe(400)
    expect((await res.json()).error.code).toBe('INVALID_INPUT')
  })
})

describe('POST /api/check-in/self (geofenced)', () => {
  it('is disabled until the venue coordinates are set', async () => {
    const res = await selfCheckIn.POST(post('/api/check-in/self', { location: { lat: -6.89, lng: 107.61, accuracy: 10 } }))
    expect(res.status).toBe(503)
    expect(state.db.calls).toEqual([])
  })

  it('needs a location, and refuses one outside the venue', async () => {
    vi.stubEnv('VENUE_LAT', '-6.8915')
    vi.stubEnv('VENUE_LNG', '107.6107')
    expect((await selfCheckIn.POST(post('/api/check-in/self', {}))).status).toBe(400)
    const far = await selfCheckIn.POST(post('/api/check-in/self', { location: { lat: -6.2, lng: 106.8, accuracy: 10 } }))
    expect(far.status).toBe(403)
    expect(state.db.calls).toEqual([])
  })

  it('checks in from inside the venue', async () => {
    vi.stubEnv('VENUE_LAT', '-6.8915')
    vi.stubEnv('VENUE_LNG', '107.6107')
    state.db = createFakeDb((call) => {
      if (call.table === 'visitor_tickets' && call.op === 'select' && call.mode === 'maybeSingle') {
        return {
          data: {
            id: '00000000-0000-4000-8000-000000000001',
            user_id: 'user-1',
            qr_code: 'q3Jx9_aZ-0bC1dE2fG3hI4',
            ticket_type: 'general_gate',
            checked_in: false,
            checked_in_at: null,
            checked_in_by: null,
            profiles: { full_name: 'U', email: 'u@example.com', institution: null },
          },
          error: null,
        }
      }
      if (call.table === 'visitor_tickets' && call.op === 'update') return { data: [{ id: 'x' }], error: null }
      return { data: { id: 'row' }, error: null }
    })
    const res = await selfCheckIn.POST(post('/api/check-in/self', { location: { lat: -6.8916, lng: 107.6108, accuracy: 15 } }))
    expect(res.status).toBe(200)
    expect((await res.json()).data).toMatchObject({ checkedIn: true, alreadyCheckedIn: false })
    expect(writesTo(state.db, 'gate_check_ins')).toHaveLength(1)
  })
})

describe('POST /api/partners/inquiry', () => {
  it('is disabled', async () => {
    expect((await inquiry.POST()).status).toBe(404)
  })
})

describe('POST /api/check-in/manual search', () => {
  it('returns ticket ids and a masked phone, never QR tokens', async () => {
    state.scoped = { ok: true, user: { id: 'staff' }, role: 'gate_staff' }
    state.db = createFakeDb(() => ({
      data: [
        {
          id: 'ticket-1',
          user_id: 'user-1',
          qr_code: 'q3Jx9_aZ-0bC1dE2fG3hI4',
          checked_in: false,
          checked_in_at: null,
          profiles: { id: 'user-1', full_name: 'Budi', email: 'budi@example.com', institution: 'ITB', phone: '+62 812-3456-7890' },
        },
      ],
      error: null,
    }))
    const res = await manual.POST(post('/api/check-in/manual', { action: 'search', query: 'bud' }))
    const body = await res.json()
    expect(body.data.results[0]).toMatchObject({ ticketId: 'ticket-1', phoneHint: '•••• 7890' })
    expect(JSON.stringify(body)).not.toContain('q3Jx9_aZ')
    expect(JSON.stringify(body)).not.toContain('812-3456')
  })
})
