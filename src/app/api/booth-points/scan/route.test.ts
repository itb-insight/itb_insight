import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDb, type FakeDb } from '../../../../../tests/support/fake-supabase'

const state = vi.hoisted(() => ({
  db: undefined as unknown as FakeDb,
  user: { id: 'staff-1', email: 'staff@example.com' } as { id: string; email: string } | null,
  booth: { scope: 'all' } as { scope: 'all' | string[] } | null,
  audits: [] as Array<Record<string, unknown>>,
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

beforeEach(() => {
  state.user = { id: 'staff-1', email: 'staff@example.com' }
  state.booth = { scope: 'all' }
  state.audits = []
  state.db = createFakeDb((call) => {
    if (call.table === 'booths') {
      const id = call.filters.find((f) => f.method === 'eq' && f.args[0] === 'id')?.args[1]
      return { data: id === BOOTH ? BOOTH_ROW : null, error: null }
    }
    if (call.table === 'visitor_tickets') {
      return {
        data: { user_id: 'visitor-1', profiles: { full_name: 'Alya', institution: 'ITB', role_a: null } },
        error: null,
      }
    }
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

  it('looks up the visitor behind the QR without awarding', async () => {
    const res = await post({ qrCode: QR, boothId: BOOTH })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.visitor).toEqual({ key: 'visitor-1', fullName: 'Alya', institution: 'ITB' })
    expect(body.data.plan).toBeUndefined()
    expect(state.audits).toHaveLength(0)
  })

  it('confirms an award, writes no points, and leaves an audit trail', async () => {
    const res = await post({ qrCode: QR, boothId: BOOTH, option: 'bonus', given: { contribution: false, bonus: false } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.practice).toBe(true)
    // The booth's own amounts: Formulatrix gives 10 + 5.
    expect(body.data.plan).toEqual({ option: 'bonus', contribution: 10, bonus: 5, total: 15 })
    expect(body.data.booth.name).toBe('Formulatrix')
    expect(typeof body.data.reference).toBe('string')
    expect(state.db.calls.filter((c) => c.op !== 'select')).toEqual([])
    expect(state.audits[0]).toMatchObject({ action: 'BOOTH_POINTS_PRACTICE', userId: 'staff-1' })
  })

  it('refuses an option already given, a booth outside the scope, and a non-visitor QR', async () => {
    const again = await post({ qrCode: QR, boothId: BOOTH, option: 'contribution', given: { contribution: true, bonus: false } })
    expect(again.status).toBe(409)

    state.booth = { scope: [OTHER_BOOTH] }
    expect((await post({ qrCode: QR, boothId: BOOTH })).status).toBe(403)

    state.booth = { scope: 'all' }
    expect((await post({ qrCode: QR, boothId: OTHER_BOOTH })).status).toBe(403) // not an active booth
    expect((await post({ qrCode: QR, boothId: 'mock-booth-1a' })).status).toBe(403) // not a booth id

    state.booth = { scope: 'all' }
    expect((await post({ qrCode: 'https://example.com', boothId: BOOTH })).status).toBe(400)
    expect((await post({ qrCode: QR, boothId: BOOTH, option: 'jackpot' })).status).toBe(400)
  })
})
