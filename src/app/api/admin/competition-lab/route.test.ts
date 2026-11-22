import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDb, writesTo, type FakeDb } from '../../../../../tests/support/fake-supabase'

const state = vi.hoisted(() => ({
  db: undefined as unknown as FakeDb,
  admin: true,
}))

vi.mock('@/lib/supabase/server', async () => {
  const { createFakeClient } = await import('../../../../../tests/support/fake-supabase')
  return { createServiceClient: () => createFakeClient(state.db), createClient: async () => createFakeClient(state.db) }
})

vi.mock('@/lib/admin', () => ({
  getScopedUser: async () =>
    state.admin
      ? { ok: true, role: 'admin', user: { id: 'admin-1', email: 'admin@x.id', email_confirmed_at: '2026-01-01' } }
      : { ok: false, code: 'ADMIN_ONLY', message: 'Akses ditolak.', status: 403 },
}))

const { POST } = await import('./route')

const post = (body: unknown) =>
  POST(new NextRequest('https://insight.test/api/admin/competition-lab', { method: 'POST', body: JSON.stringify(body) }))

beforeEach(() => {
  state.admin = true
  state.db = createFakeDb((call) => {
    if (call.table === 'competition_teams' && call.op === 'select') return { data: [{ id: 'test-team' }], error: null }
    return { data: [], error: null }
  })
})

describe('POST /api/admin/competition-lab', () => {
  it('is admin only', async () => {
    state.admin = false
    const res = await post({ action: 'reset' })
    expect(res.status).toBe(403)
    expect(state.db.calls).toEqual([])
  })

  it('reset deletes only test teams (and their registrations first)', async () => {
    const res = await post({ action: 'reset' })
    expect(res.status).toBe(200)

    const lookup = state.db.calls.find((call) => call.table === 'competition_teams' && call.op === 'select')!
    expect(lookup.filters).toContainEqual({ method: 'eq', args: ['source', 'test'] })

    const [registrations] = writesTo(state.db, 'competition_registrations')
    expect(registrations.filters).toContainEqual({ method: 'in', args: ['team_id', ['test-team']] })

    const [teams] = writesTo(state.db, 'competition_teams')
    expect(teams.op).toBe('delete')
    // Re-checked on the delete itself, not only on the lookup.
    expect(teams.filters).toContainEqual({ method: 'eq', args: ['source', 'test'] })
  })

  it('release only gives back slots in test teams held by the caller', async () => {
    await post({ action: 'release' })
    const [release] = writesTo(state.db, 'competition_team_members')
    expect(release.payload).toEqual({ user_id: null, claimed_at: null, email: null })
    expect(release.filters).toContainEqual({ method: 'in', args: ['team_id', ['test-team']] })
    expect(release.filters).toContainEqual({ method: 'eq', args: ['user_id', 'admin-1'] })
  })

  it('rejects a malformed team id and unknown actions', async () => {
    expect((await post({ action: 'delete', teamId: "x' or 1=1" })).status).toBe(400)
    expect((await post({ action: 'drop-everything' })).status).toBe(400)
    expect((await post({ action: 12 })).status).toBe(400)
  })

  it('seed refuses an invalid email before writing anything', async () => {
    const res = await post({
      action: 'seed',
      competitionSlug: 'olimpiade-engineering',
      teamName: 'TEST',
      school: 'SMA Uji',
      member1Name: 'Ketua',
      member1Email: 'not-an-email',
    })
    expect(res.status).toBe(400)
    expect(state.db.calls.filter((call) => call.op !== 'select')).toEqual([])
  })
})
