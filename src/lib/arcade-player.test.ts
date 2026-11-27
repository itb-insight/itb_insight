import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { FakeDb } from '../../tests/support/fake-supabase'

const state = vi.hoisted(() => ({ db: undefined as unknown as FakeDb }))
vi.mock('@/lib/supabase/server', async () => {
  const { createFakeClient } = await import('../../tests/support/fake-supabase')
  return { createServiceClient: () => createFakeClient(state.db), createClient: async () => createFakeClient(state.db) }
})
// The leaderboard is cached with unstable_cache; run it straight through here.
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }))

const { createFakeDb } = await import('../../tests/support/fake-supabase')
const { getArcadePlayer } = await import('./arcade')

const QUEST = {
  id: 'q1', slug: 'arcade-follow-ig', title: 'Follow IG @itbinsight', description: null, points: 10, verify: 'proof',
  shortcut_url: null, needs_handle: 'instagram', needs_vote: false, area: null,
}

function db(questsResolve: (columns: string) => { data: unknown; error: unknown }) {
  return createFakeDb((call) => {
    if (call.table === 'sidequests') return questsResolve(call.columns ?? '')
    if (call.table === 'rpc:arcade_leaderboard') return { data: { players: 0, entries: [] }, error: null }
    if (call.table.startsWith('rpc:')) return { data: false, error: null }
    return { data: [], error: null }
  })
}

describe('getArcadePlayer side quests', () => {
  beforeEach(() => vi.spyOn(console, 'warn').mockImplementation(() => {}))

  it('reads proof_kind when migration 0035 has run', async () => {
    state.db = db(() => ({ data: [{ ...QUEST, proof_kind: 'link' }], error: null }))
    const player = await getArcadePlayer('u1')
    expect(player.sideQuests).toHaveLength(1)
    expect(player.sideQuests[0].proofKind).toBe('link')
  })

  it('still lists quests (as photo proofs) before 0035 adds proof_kind', async () => {
    state.db = db((columns) =>
      columns.includes('proof_kind')
        ? { data: null, error: { code: '42703', message: 'column sidequests.proof_kind does not exist' } }
        : { data: [QUEST], error: null },
    )
    const player = await getArcadePlayer('u1')
    expect(player.sideQuests.map((q) => [q.slug, q.proofKind])).toEqual([['arcade-follow-ig', 'photo']])
  })
})
