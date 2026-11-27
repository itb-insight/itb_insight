import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDb, type FakeCall, type FakeDb } from '../../../../../tests/support/fake-supabase'

const state = vi.hoisted(() => ({
  db: undefined as unknown as FakeDb,
  user: { id: 'stakeholder-1', email: 'lead@example.com' } as { id: string; email: string } | null,
  boothManager: true,
  insertError: null as { code: string; message: string } | null,
  revokedRow: { id: '' as string, email: 'lo@example.com', booth_id: '' as string } as Record<string, string> | null,
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
  getAdminAccess: async () => ({ isAdmin: false, booth: { scope: 'all' }, boothManager: state.boothManager }),
}))

const { POST } = await import('./route')

const BOOTH = '11111111-1111-4111-8111-111111111111'
const MISSING_BOOTH = '22222222-2222-4222-8222-222222222222'
const ASSIGNMENT = '33333333-3333-4333-8333-333333333333'

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/booth-points/access', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    }),
  )
}

const writes = () => state.db.calls.filter((c: FakeCall) => c.op !== 'select')
const eqArg = (call: FakeCall, column: string) => call.filters.find((f) => f.method === 'eq' && f.args[0] === column)?.args[1]

beforeEach(() => {
  state.user = { id: 'stakeholder-1', email: 'lead@example.com' }
  state.boothManager = true
  state.insertError = null
  state.revokedRow = { id: ASSIGNMENT, email: 'lo@example.com', booth_id: BOOTH }
  state.db = createFakeDb((call) => {
    if (call.table === 'booths') {
      return { data: eqArg(call, 'id') === BOOTH ? { id: BOOTH, name: 'Buzz Wire' } : null, error: null }
    }
    if (call.table === 'booth_staff_assignments' && call.op === 'insert') {
      return state.insertError ? { data: null, error: state.insertError } : { data: { id: ASSIGNMENT }, error: null }
    }
    if (call.table === 'booth_staff_assignments' && call.op === 'update') {
      return { data: eqArg(call, 'id') === ASSIGNMENT ? state.revokedRow : null, error: null }
    }
    return { data: null, error: null }
  })
})

describe('POST /api/booth-points/access', () => {
  it('rejects signed-out callers and accounts that cannot manage booth access', async () => {
    state.user = null
    expect((await post({ action: 'grant', email: 'lo@example.com', boothId: BOOTH })).status).toBe(401)

    state.user = { id: 'staff-1', email: 'staff@example.com' }
    state.boothManager = false
    expect((await post({ action: 'grant', email: 'lo@example.com', boothId: BOOTH })).status).toBe(403)
    expect(writes()).toEqual([])
  })

  it('grants a booth to a normalised email, recorded as done by the caller', async () => {
    const res = await post({ action: 'grant', email: '  LO@Example.com ', boothId: BOOTH })
    expect(res.status).toBe(201)
    expect((await res.json()).data).toEqual({ id: ASSIGNMENT, email: 'lo@example.com', boothId: BOOTH, boothName: 'Buzz Wire' })

    const [insert] = writes()
    expect(insert).toMatchObject({
      table: 'booth_staff_assignments',
      op: 'insert',
      payload: { email: 'lo@example.com', booth_id: BOOTH, assigned_by: 'stakeholder-1' },
    })
  })

  it('refuses a bad email, an unknown booth, and a booth already assigned', async () => {
    expect((await post({ action: 'grant', email: 'not-an-email', boothId: BOOTH })).status).toBe(400)
    expect((await post({ action: 'grant', email: 'lo@example.com', boothId: 'mock-booth' })).status).toBe(400)
    expect((await post({ action: 'grant', email: 'lo@example.com', boothId: MISSING_BOOTH })).status).toBe(404)
    expect(writes()).toEqual([])

    state.insertError = { code: '23505', message: 'duplicate key value' }
    const dup = await post({ action: 'grant', email: 'lo@example.com', boothId: BOOTH })
    expect(dup.status).toBe(409)
    expect((await dup.json()).error.code).toBe('ALREADY_ASSIGNED')
  })

  it('revokes by marking the row, never deleting it', async () => {
    const res = await post({ action: 'revoke', assignmentId: ASSIGNMENT })
    expect(res.status).toBe(200)
    expect((await res.json()).data).toEqual({ id: ASSIGNMENT, email: 'lo@example.com', boothId: BOOTH })

    const [update] = writes()
    expect(update.op).toBe('update')
    expect(update.payload).toMatchObject({ revoked_by: 'stakeholder-1' })
    expect(typeof (update.payload as { revoked_at: unknown }).revoked_at).toBe('string')
    expect(update.filters).toContainEqual({ method: 'is', args: ['revoked_at', null] })
    expect(state.db.calls.some((c) => c.op === 'delete')).toBe(false)
  })

  it('reports an assignment that is already revoked, and unknown actions', async () => {
    state.revokedRow = null
    expect((await post({ action: 'revoke', assignmentId: ASSIGNMENT })).status).toBe(404)
    expect((await post({ action: 'revoke', assignmentId: 'nope' })).status).toBe(400)
    expect((await post({ action: 'delete', assignmentId: ASSIGNMENT })).status).toBe(400)
    expect((await post({ action: 'grant', email: { $ne: '' }, boothId: BOOTH })).status).toBe(400)
  })
})
