import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDb, type FakeCall, type FakeDb } from '../../../../../tests/support/fake-supabase'

const state = vi.hoisted(() => ({
  db: undefined as unknown as FakeDb,
  user: { id: 'staff-1', email: 'staff@example.com' } as { id: string; email: string } | null,
  booth: { scope: 'all' } as { scope: 'all' | string[] } | null,
  audits: [] as Array<Record<string, unknown>>,
  ticketUser: 'visitor-1',
  committee: false,
  given: [] as Array<{ kind: string; bonus_points: number }>,
  award: null as unknown,
  awardError: null as { message: string } | null,
}))

vi.mock('@/lib/supabase/server', async () => {
  const { createFakeClient } = await import('../../../../../tests/support/fake-supabase')
  return {
    createServiceClient: () => createFakeClient(state.db),
    createClient: async () => createFakeClient(state.db),
  }
})

vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: async () =>
    state.user
      ? { ok: true, user: state.user }
      : { ok: false, code: 'UNAUTHORIZED', message: 'Unauthorized', status: 401 },
}))

vi.mock('@/lib/admin-access', () => ({
  getAdminAccess: async () => ({ isAdmin: false, booth: state.booth, roleA: 'staff' }),
}))

vi.mock('@/lib/audit', () => ({
  recordAuditLog: async (params: Record<string, unknown>) => {
    state.audits.push(params)
    return null
  },
}))

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return { ...actual, after: (fn: () => unknown) => fn() }
})

const { POST } = await import('./route')

const QR = 'itbi:v1:abcdefghijklmnopqrstuv'
const BOOTH = '11111111-1111-4111-8111-111111111111'
const OTHER_BOOTH = '22222222-2222-4222-8222-222222222222'
const REF = '33333333-3333-4333-8333-333333333333'
const BOOTH_ROW = { id: BOOTH, slug: 'tech-xhibition-13-formulatrix', name: 'Formulatrix', category: 'tech-xhibition', points: 10, max_bonus_points: 5 }

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/booth-points/scan', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    }),
  )
}

const awardCalls = () => state.db.calls.filter((c: FakeCall) => c.table === 'rpc:arcade_award_booth')

beforeEach(() => {
  state.user = { id: 'staff-1', email: 'staff@example.com' }
  state.booth = { scope: 'all' }
  state.audits = []
  state.ticketUser = 'visitor-1'
  state.committee = false
  state.given = []
  state.award = {
    ok: true,
    code: 'AWARDED',
    id: 'abcdef12-0000-4000-8000-000000000000',
    contribution: 10,
    bonus: 5,
    total: 15,
    given: { contribution: true, bonus: true },
  }
  state.awardError = null
  state.db = createFakeDb((call) => {
    if (call.table === 'booths') {
      const id = call.filters.find((f) => f.method === 'eq' && f.args[0] === 'id')?.args[1]
      return { data: id === BOOTH ? BOOTH_ROW : null, error: null }
    }
    if (call.table === 'visitor_tickets') {
      return { data: { user_id: state.ticketUser, profiles: { full_name: 'Alya', institution: 'ITB' } }, error: null }
    }
    if (call.table === 'rpc:arcade_is_committee') return { data: state.committee, error: null }
    if (call.table === 'booth_scan_events') return { data: state.given, error: null }
    if (call.table === 'rpc:arcade_award_booth') return { data: state.award, error: state.awardError }
    return { data: null, error: null }
  })
})

describe('POST /api/booth-points/scan', () => {
  it('rejects signed-out callers and accounts without booth access', async () => {
    state.user = null
    expect((await post({ qrCode: QR, boothId: BOOTH })).status).toBe(401)

    state.user = { id: 'visitor-2', email: 'v@example.com' }
    state.booth = null
    expect((await post({ qrCode: QR, boothId: BOOTH })).status).toBe(403)
  })

  it("looks up the visitor and what they already have at this booth, from the server", async () => {
    state.given = [{ kind: 'visit', bonus_points: 0 }]
    const res = await post({ qrCode: QR, boothId: BOOTH })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.visitor).toEqual({ key: 'visitor-1', fullName: 'Alya', institution: 'ITB' })
    expect(body.data.given).toEqual({ contribution: true, bonus: false })
    expect(body.data.plan).toBeUndefined()
    expect(awardCalls()).toEqual([])
  })

  it('refuses the scanner\'s own account before anything is written, but lets committee accounts play', async () => {
    state.ticketUser = 'staff-1'
    const self = await post({ qrCode: QR, boothId: BOOTH, option: 'contribution' })
    expect(self.status).toBe(403)
    expect((await self.json()).error.code).toBe('SELF_AWARD')

    expect(awardCalls()).toEqual([])

    // Staff test the game: no committee check here any more; the leaderboard leaves them out.
    state.ticketUser = 'visitor-1'
    state.committee = true
    const committee = await post({ qrCode: QR, boothId: BOOTH, option: 'contribution' })
    expect(committee.status).toBe(200)
    expect(awardCalls()).toHaveLength(1)
  })

  it('awards through arcade_award_booth with the scanner as awarder and the clientRef', async () => {
    const res = await post({ qrCode: QR, boothId: BOOTH, option: 'bonus', clientRef: REF })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.plan).toEqual({ option: 'bonus', contribution: 10, bonus: 5, total: 15 })
    expect(body.data.given).toEqual({ contribution: true, bonus: true })
    expect(body.data.duplicate).toBe(false)

    const [call] = awardCalls()
    expect(call.payload).toMatchObject({
      p_user: 'visitor-1',
      p_booth: BOOTH,
      p_option: 'bonus',
      p_awarded_by: 'staff-1',
      p_client_ref: REF,
      p_captured_at: null,
    })
    expect(state.audits[0]).toMatchObject({ action: 'BOOTH_POINTS_AWARDED', userId: 'staff-1' })
  })

  it('a replayed clientRef reports success without a second audit row', async () => {
    state.award = { ok: true, code: 'DUPLICATE', contribution: 0, bonus: 0, total: 0, given: { contribution: true, bonus: false } }
    const res = await post({ qrCode: QR, boothId: BOOTH, option: 'contribution', clientRef: REF })
    expect(res.status).toBe(200)
    expect((await res.json()).data.duplicate).toBe(true)
    expect(state.audits).toEqual([])
  })

  it('maps refusals from the database: already given, closed window, kill switch', async () => {
    state.award = { ok: false, code: 'ALREADY_GIVEN', given: { contribution: true, bonus: false } }
    const again = await post({ qrCode: QR, boothId: BOOTH, option: 'contribution' })
    expect(again.status).toBe(409)
    expect((await again.json()).data.given).toEqual({ contribution: true, bonus: false })

    state.award = { ok: false, code: 'NOT_OPEN', opensAt: '2026-11-27T23:00:00Z' }
    const early = await post({ qrCode: QR, boothId: BOOTH, option: 'contribution' })
    expect(early.status).toBe(403)
    expect((await early.json()).error.message).toContain('06:00')

    state.award = { ok: false, code: 'PAUSED' }
    expect((await post({ qrCode: QR, boothId: BOOTH, option: 'contribution' })).status).toBe(423)

    state.award = null
    state.awardError = { message: 'ARCADE_CLOSED' }
    expect((await post({ qrCode: QR, boothId: BOOTH, option: 'contribution' })).status).toBe(403)
    expect(state.audits).toEqual([])
  })

  it('refuses a booth outside the scope, a non-visitor QR, and bad input', async () => {
    state.booth = { scope: [OTHER_BOOTH] }
    expect((await post({ qrCode: QR, boothId: BOOTH })).status).toBe(403)

    state.booth = { scope: 'all' }
    expect((await post({ qrCode: QR, boothId: OTHER_BOOTH })).status).toBe(403) // not an active booth
    expect((await post({ qrCode: QR, boothId: 'mock-booth-1a' })).status).toBe(403) // not a booth id
    expect((await post({ qrCode: 'https://example.com', boothId: BOOTH })).status).toBe(400)
    expect((await post({ qrCode: QR, boothId: BOOTH, option: 'jackpot' })).status).toBe(400)
    expect((await post({ qrCode: QR, boothId: BOOTH, option: 'bonus', clientRef: 'not-a-uuid' })).status).toBe(400)
    expect(awardCalls()).toEqual([])
  })
})
