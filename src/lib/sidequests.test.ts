import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDb, type FakeDb } from '../../tests/support/fake-supabase'

const state = vi.hoisted(() => ({
  db: undefined as unknown as FakeDb,
}))

vi.mock('@/lib/supabase/server', async () => {
  const { createFakeClient } = await import('../../tests/support/fake-supabase')
  return {
    createServiceClient: () => createFakeClient(state.db),
    createClient: async () => createFakeClient(state.db),
  }
})

const {
  getSidequestWindow,
  submitSidequest,
  reviewSidequestSubmission,
  getLeaderboard,
  claimRewardTier,
} = await import('./sidequests')

const QUEST = {
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

describe('getSidequestWindow (05:00 - 17:00 WIB & leaderboard freeze)', () => {
  beforeEach(() => {
    vi.stubEnv('SIDEQUEST_DATE', '2026-11-28')
    vi.stubEnv('SIDEQUEST_START_HOUR', '5')
    vi.stubEnv('SIDEQUEST_CLOSE_HOUR', '17')
    vi.stubEnv('SIDEQUEST_FORCE_WINDOW', '')
  })

  it('reports not_started before 05:00 WIB, open between 05:00 and 17:00 WIB, and frozen at/after 17:00 WIB', () => {
    const before5am = getSidequestWindow(new Date('2026-11-28T04:59:59+07:00'))
    expect(before5am.status).toBe('not_started')
    expect(before5am.isOpen).toBe(false)
    expect(before5am.isFrozen).toBe(false)

    const at5am = getSidequestWindow(new Date('2026-11-28T05:00:00+07:00'))
    expect(at5am.status).toBe('open')
    expect(at5am.isOpen).toBe(true)
    expect(at5am.isFrozen).toBe(false)

    const at5pm = getSidequestWindow(new Date('2026-11-28T17:00:00+07:00'))
    expect(at5pm.status).toBe('frozen')
    expect(at5pm.isOpen).toBe(false)
    expect(at5pm.isFrozen).toBe(true)
    expect(at5pm.freezeCutoffIso).toBe(new Date('2026-11-28T17:00:00+07:00').toISOString())
  })
})

describe('submitSidequest & reviewSidequestSubmission', () => {
  let profileRoleA: string | null
  let existingSub: Record<string, unknown> | null

  beforeEach(() => {
    vi.stubEnv('SIDEQUEST_DATE', '2026-11-28')
    vi.stubEnv('SIDEQUEST_START_HOUR', '5')
    vi.stubEnv('SIDEQUEST_CLOSE_HOUR', '17')
    vi.stubEnv('SIDEQUEST_FORCE_WINDOW', '')
    profileRoleA = null
    existingSub = null

    state.db = createFakeDb((call) => {
      if (call.table === 'profiles') {
        return { data: { id: 'user-1', role_a: profileRoleA }, error: null }
      }
      if (call.table === 'sidequests') {
        return { data: QUEST, error: null }
      }
      if (call.table === 'sidequest_submissions') {
        if (call.op === 'select') {
          return { data: existingSub, error: null }
        }
        if (call.op === 'insert') {
          const payload = call.payload as Record<string, unknown>
          return {
            data: { id: 'sub-1', ...payload, submitted_at: '2026-11-28T09:00:00+07:00' },
            error: null,
          }
        }
        if (call.op === 'update') {
          const payload = call.payload as Record<string, unknown>
          return {
            data: { ...existingSub, ...payload },
            error: null,
          }
        }
      }
      if (call.table === 'audit_logs') {
        return { data: { id: 'audit-1' }, error: null }
      }
      return { data: null, error: null }
    })
  })

  it('blocks submissions before 05:00 WIB and after 17:00 WIB', async () => {
    const early = await submitSidequest({
      userId: 'user-1',
      questSlug: 'follow-ig-itb-insight',
      proofUrl: 'https://instagram.com/p/abc',
      now: new Date('2026-11-28T04:30:00+07:00'),
    })
    expect(early).toMatchObject({ ok: false, code: 'WINDOW_NOT_OPEN' })

    const late = await submitSidequest({
      userId: 'user-1',
      questSlug: 'follow-ig-itb-insight',
      proofUrl: 'https://instagram.com/p/abc',
      now: new Date('2026-11-28T17:00:01+07:00'),
    })
    expect(late).toMatchObject({ ok: false, code: 'WINDOW_CLOSED' })
  })

  it('rejects committee accounts and missing/invalid proof URLs', async () => {
    const openNow = new Date('2026-11-28T10:00:00+07:00')
    profileRoleA = 'staff'
    expect(
      await submitSidequest({
        userId: 'user-1',
        questSlug: 'follow-ig-itb-insight',
        proofUrl: 'https://instagram.com/p/abc',
        now: openNow,
      }),
    ).toMatchObject({ ok: false, code: 'COMMITTEE_ACCOUNT' })

    profileRoleA = null
    expect(
      await submitSidequest({
        userId: 'user-1',
        questSlug: 'follow-ig-itb-insight',
        now: openNow,
      }),
    ).toMatchObject({ ok: false, code: 'PROOF_REQUIRED' })

    expect(
      await submitSidequest({
        userId: 'user-1',
        questSlug: 'follow-ig-itb-insight',
        proofUrl: 'javascript:alert(1)',
        now: openNow,
      }),
    ).toMatchObject({ ok: false, code: 'INVALID_PROOF_URL' })
  })

  it('creates a pending submission during 05:00-17:00 WIB and awards quest points when admin approves', async () => {
    const openNow = new Date('2026-11-28T10:00:00+07:00')
    const submitted = await submitSidequest({
      userId: 'user-1',
      questSlug: 'follow-ig-itb-insight',
      proofUrl: 'https://instagram.com/p/abc',
      now: openNow,
    })
    expect(submitted).toMatchObject({
      ok: true,
      submission: { id: 'sub-1', status: 'pending', points_awarded: 0 },
    })

    existingSub = {
      id: 'sub-1',
      quest_id: QUEST.id,
      user_id: 'user-1',
      status: 'pending',
      points_awarded: 0,
      sidequests: { id: QUEST.id, title: QUEST.title, points: 10 },
    }

    const approved = await reviewSidequestSubmission({
      submissionId: 'sub-1',
      adminUserId: 'admin-1',
      decision: 'approved',
      reviewNote: 'Valid screenshot',
    })
    expect(approved).toMatchObject({
      ok: true,
      pointsAwarded: 10,
      submission: { status: 'approved', points_awarded: 10 },
    })
  })
})

describe('getLeaderboard & claimRewardTier', () => {
  beforeEach(() => {
    vi.stubEnv('SIDEQUEST_DATE', '2026-11-28')
    vi.stubEnv('SIDEQUEST_START_HOUR', '5')
    vi.stubEnv('SIDEQUEST_CLOSE_HOUR', '17')
    vi.stubEnv('SIDEQUEST_FORCE_WINDOW', '')
  })

  it('combines booth points + approved sidequest points, excludes committee accounts, sorts by earliest reach on tie, and applies 17:00 WIB cutoff when frozen', async () => {
    state.db = createFakeDb((call) => {
      if (call.table === 'booth_scan_events') {
        return {
          data: [
            {
              user_id: 'u-1',
              points_awarded: 100,
              scanned_at: '2026-11-28T09:00:00Z',
              profiles: { full_name: 'Alya', institution: 'ITB', role_a: null },
            },
            {
              user_id: 'u-2',
              points_awarded: 110,
              scanned_at: '2026-11-28T08:00:00Z',
              profiles: { full_name: 'Bima', institution: 'ITB', role_a: null },
            },
            {
              user_id: 'u-staff',
              points_awarded: 500,
              scanned_at: '2026-11-28T07:00:00Z',
              profiles: { full_name: 'Panitia', institution: 'ITB', role_a: 'staff' },
            },
          ],
          error: null,
        }
      }
      if (call.table === 'sidequest_submissions') {
        return {
          data: [
            {
              user_id: 'u-1',
              points_awarded: 10,
              submitted_at: '2026-11-28T09:30:00Z',
              profiles: { full_name: 'Alya', institution: 'ITB', role_a: null },
            },
          ],
          error: null,
        }
      }
      return { data: [], error: null }
    })

    // Both u-1 (100+10=110 at 09:30Z) and u-2 (110 at 08:00Z) have 110 pts -> u-2 wins tie-breaker (earlier timestamp)
    const lb = await getLeaderboard({ now: new Date('2026-11-28T18:00:00+07:00') })
    expect(lb.window.isFrozen).toBe(true)
    expect(lb.entries.map((e) => ({ rank: e.rank, userId: e.userId, totalPoints: e.totalPoints }))).toEqual([
      { rank: 1, userId: 'u-2', totalPoints: 110 },
      { rank: 2, userId: 'u-1', totalPoints: 110 },
    ])

    // Verify the 17:00 WIB cutoff filter was applied on both queries
    const boothCall = state.db.calls.find((c) => c.table === 'booth_scan_events')!
    expect(boothCall.filters).toContainEqual({
      method: 'lte',
      args: ['scanned_at', new Date('2026-11-28T17:00:00+07:00').toISOString()],
    })
  })

  it('enforces minimum points, double-claim guard, and stock quota on reward tier claims', async () => {
    let totalBoothPoints = 80
    let alreadyClaimed = false
    let claimedCount = 0

    state.db = createFakeDb((call) => {
      if (call.table === 'profiles') return { data: { id: 'u-1', role_a: null }, error: null }
      if (call.table === 'reward_tiers') {
        return {
          data: {
            id: 'tier-5',
            tier_number: 5,
            min_points: 301,
            max_points: 350,
            reward_name: 'Grand Prize (Top 3 Tercepat)',
            total_stock: 3,
            is_active: true,
          },
          error: null,
        }
      }
      if (call.table === 'booth_scan_events') return { data: [{ points_awarded: totalBoothPoints }], error: null }
      if (call.table === 'sidequest_submissions') return { data: [], error: null }
      if (call.table === 'reward_claims') {
        if (call.op === 'insert') {
          return {
            data: { id: 'claim-1', tier_id: 'tier-5', user_id: 'u-1', points_at_claim: totalBoothPoints },
            error: null,
          }
        }
        if (call.mode === 'maybeSingle') {
          return { data: alreadyClaimed ? { id: 'claim-existing' } : null, error: null }
        }
        return { data: [], error: null, count: claimedCount }
      }
      if (call.table === 'audit_logs') return { data: { id: 'a-1' }, error: null }
      return { data: null, error: null }
    })

    // 1. Not enough points
    expect(await claimRewardTier({ userId: 'u-1', tierNumber: 5 })).toMatchObject({
      ok: false,
      code: 'INSUFFICIENT_POINTS',
    })

    // 2. Enough points, but Top 3 quota is full
    totalBoothPoints = 320
    claimedCount = 3
    expect(await claimRewardTier({ userId: 'u-1', tierNumber: 5 })).toMatchObject({
      ok: false,
      code: 'OUT_OF_STOCK',
    })

    // 3. Quota available -> succeeds
    claimedCount = 2
    const claimed = await claimRewardTier({ userId: 'u-1', tierNumber: 5 })
    expect(claimed).toMatchObject({
      ok: true,
      totalPoints: 320,
      tier: { tier_number: 5 },
    })

    // 4. Second claim -> blocked
    alreadyClaimed = true
    expect(await claimRewardTier({ userId: 'u-1', tierNumber: 5 })).toMatchObject({
      ok: false,
      code: 'ALREADY_CLAIMED',
    })
  })
})
