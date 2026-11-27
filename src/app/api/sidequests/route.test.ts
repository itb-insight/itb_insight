import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDb, type FakeDb } from '../../../../tests/support/fake-supabase'

const state = vi.hoisted(() => ({
  db: undefined as unknown as FakeDb,
  user: { id: 'visitor-1', email: 'visitor@example.com' } as { id: string; email: string } | null,
  admin: true,
}))

vi.mock('@/lib/supabase/server', async () => {
  const { createFakeClient } = await import('../../../../tests/support/fake-supabase')
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

vi.mock('@/lib/admin', () => ({
  getScopedUser: async () =>
    state.admin
      ? { ok: true, role: 'admin', user: { id: 'admin-1', email: 'admin@insight.id' } }
      : { ok: false, code: 'ADMIN_ONLY', message: 'Akses ditolak.', status: 403 },
  getUserRole: async () => (state.admin ? 'admin' : null),
}))

const { GET: getQuests, POST: postQuest } = await import('./route')
const { GET: getAdminQuests, POST: postAdminQuest } = await import('../admin/sidequests/route')
const { GET: getLeaderboardRoute } = await import('./leaderboard/route')

const questObj = {
  id: '11111111-1111-1111-1111-111111111111',
  slug: 'follow-ig-itb-insight',
  category: 'marketing',
  title: 'Follow IG @itbinsight',
  points: 10,
  requires_proof: true,
  target_count: 1,
  order_index: 1,
  is_active: true,
}

beforeEach(() => {
  vi.stubEnv('SIDEQUEST_FORCE_WINDOW', 'open')
  state.user = { id: 'visitor-1', email: 'visitor@example.com' }
  state.admin = true

  state.db = createFakeDb((call) => {
    if (call.table === 'profiles') return { data: { id: 'visitor-1', role_a: null }, error: null }
    if (call.table === 'sidequests') {
      return { data: call.mode === 'maybeSingle' ? questObj : [questObj], error: null }
    }
    if (call.table === 'sidequest_submissions') {
      if (call.op === 'insert') {
        return {
          data: {
            id: '22222222-2222-2222-2222-222222222222',
            quest_id: questObj.id,
            user_id: 'visitor-1',
            status: 'pending',
            points_awarded: 0,
          },
          error: null,
        }
      }
      if (call.op === 'update') {
        const patch = call.payload as Record<string, unknown>
        return {
          data: {
            id: '22222222-2222-2222-2222-222222222222',
            quest_id: questObj.id,
            user_id: 'visitor-1',
            ...patch,
          },
          error: null,
        }
      }
      if (call.mode === 'maybeSingle') {
        const idFilter = call.filters.find((f) => f.method === 'eq' && f.args[0] === 'id')?.args[1]
        if (idFilter === '22222222-2222-2222-2222-222222222222') {
          return {
            data: {
              id: '22222222-2222-2222-2222-222222222222',
              quest_id: questObj.id,
              user_id: 'visitor-1',
              status: 'pending',
              points_awarded: 0,
              sidequests: { id: questObj.id, title: questObj.title, points: 10 },
            },
            error: null,
          }
        }
        return { data: null, error: null }
      }
      return { data: [], error: null }
    }
    if (call.table === 'booth_scan_events') return { data: [], error: null }
    if (call.table === 'audit_logs') return { data: { id: 'a-1' }, error: null }
    return { data: [], error: null }
  })
})

describe('Sidequest & Admin Verification API Routes', () => {
  it('GET /api/sidequests returns window and quests catalog', async () => {
    const res = await getQuests(new NextRequest('https://insight.test/api/sidequests'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.window.status).toBe('open')
    expect(json.data.quests).toHaveLength(1)
  })

  it('POST /api/sidequests requires authentication and is closed since Insight Arcade went live', async () => {
    state.user = null
    expect(
      (
        await postQuest(
          new NextRequest('https://insight.test/api/sidequests', {
            method: 'POST',
            body: JSON.stringify({ questSlug: 'follow-ig-itb-insight', proofUrl: 'https://instagram.com/p/1' }),
          }),
        )
      ).status,
    ).toBe(401)

    state.user = { id: 'visitor-1', email: 'visitor@example.com' }
    const res = await postQuest(
      new NextRequest('https://insight.test/api/sidequests', {
        method: 'POST',
        body: JSON.stringify({ questSlug: 'follow-ig-itb-insight', proofUrl: 'https://instagram.com/p/1' }),
      }),
    )
    expect(res.status).toBe(410)
    expect((await res.json()).error.code).toBe('GONE')
  })

  it('POST /api/admin/sidequests is admin-only and verifies a submission', async () => {
    state.admin = false
    expect(
      (
        await getAdminQuests(new NextRequest('https://insight.test/api/admin/sidequests'))
      ).status,
    ).toBe(403)

    state.admin = true
    const res = await postAdminQuest(
      new NextRequest('https://insight.test/api/admin/sidequests', {
        method: 'POST',
        body: JSON.stringify({
          submissionId: '22222222-2222-2222-2222-222222222222',
          decision: 'approved',
          reviewNote: 'Verified on D-Day',
        }),
      }),
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.pointsAwarded).toBe(10)
    expect(json.data.submission.status).toBe('approved')
  })

  it('GET /api/sidequests/leaderboard returns window state and ranked entries', async () => {
    const res = await getLeaderboardRoute(new NextRequest('https://insight.test/api/sidequests/leaderboard?limit=10'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.window.status).toBe('open')
  })
})
