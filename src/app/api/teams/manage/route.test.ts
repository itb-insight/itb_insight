import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  user: { id: 'leader-user', email: 'ketua@x.id' } as null | { id: string; email: string },
  calls: [] as Array<{ fn: string; input: unknown }>,
}))

vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: async () =>
    state.user ? { ok: true, user: state.user } : { ok: false, code: 'UNAUTHORIZED', message: 'x', status: 401 },
}))
vi.mock('@/lib/supabase/server', () => ({ createServiceClient: () => ({}) }))
vi.mock('@/lib/audit', () => ({ recordAuditLog: async () => null }))
vi.mock('next/server', async (importOriginal) => ({ ...(await importOriginal<object>()), after: () => undefined }))
vi.mock('@/lib/team-actions', () => {
  const ok = (fn: string) => async (_db: unknown, _user: unknown, input: unknown) => {
    state.calls.push({ fn, input })
    return { ok: true, data: {} }
  }
  return { inviteToSlot: ok('invite'), transferLeadership: ok('leader'), withdraw: ok('withdraw') }
})

const { POST } = await import('./route')

const TEAM = '11111111-1111-1111-1111-111111111111'
const MEMBER = '22222222-2222-2222-2222-222222222222'

const post = (body: unknown) =>
  POST(new NextRequest('https://insight.test/api/teams/manage', { method: 'POST', body: JSON.stringify(body) }))

beforeEach(() => {
  state.user = { id: 'leader-user', email: 'ketua@x.id' }
  state.calls = []
})

describe('POST /api/teams/manage', () => {
  it('needs a session', async () => {
    state.user = null
    expect((await post({ action: 'withdraw', teamId: TEAM, confirmation: 'MUNDUR' })).status).toBe(401)
    expect(state.calls).toEqual([])
  })

  it('validates ids and the action before calling anything', async () => {
    expect((await post({ action: 'invite', teamId: 'nope', memberId: MEMBER })).status).toBe(400)
    expect((await post({ action: 'leader', teamId: TEAM })).status).toBe(400)
    expect((await post({ action: 'rename', teamId: TEAM })).status).toBe(400)
    expect((await post({ action: 'invite', teamId: TEAM, memberId: MEMBER, email: { $ne: '' } })).status).toBe(400)
    expect(state.calls).toEqual([])
  })

  it('passes the session user and the parsed fields through', async () => {
    const res = await post({ action: 'invite', teamId: TEAM, memberId: MEMBER, email: ' a@b.id ', role: 'leader' })
    expect(res.status).toBe(200)
    expect(state.calls).toEqual([{ fn: 'invite', input: { teamId: TEAM, memberId: MEMBER, email: 'a@b.id' } }])
  })

  it('clears an invite when the email is empty', async () => {
    await post({ action: 'invite', teamId: TEAM, memberId: MEMBER, email: '' })
    expect(state.calls[0].input).toMatchObject({ email: null })
  })
})
