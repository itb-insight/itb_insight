import { describe, expect, it } from 'vitest'

import { createFakeClient, createFakeDb, eqValue, writesTo, type FakeCall, type FakeResult } from '../../tests/support/fake-supabase'

import { claimPendingSlots, normalizeEmail } from './competition-claims'

type Client = Parameters<typeof claimPendingSlots>[0]

const USER = { id: 'user-1', email: 'Ketua@Sekolah.sch.id', email_confirmed_at: '2026-11-01T00:00:00Z' }

const slot = (id: string, role: 'leader' | 'member', competitionId = 'comp-oe', teamId = `team-${id}`) => ({
  id,
  team_id: teamId,
  member_role: role,
  name: 'Budi Santoso',
  phone: role === 'leader' ? '081234567890' : null,
  institution: 'SMA Negeri 1 Bandung',
  competition_teams: { id: teamId, competition_id: competitionId, status: 'verified' },
})

const isPendingLookup = (call: FakeCall) =>
  call.table === 'competition_team_members' && call.op === 'select' && eqValue(call, 'claim_email') !== undefined
const isCurrentLookup = (call: FakeCall) =>
  call.table === 'competition_team_members' && call.op === 'select' && eqValue(call, 'user_id') !== undefined
const isClaimUpdate = (call: FakeCall) => call.table === 'competition_team_members' && call.op === 'update'

function setup(options: {
  pending?: unknown[]
  current?: unknown[]
  claimUpdate?: (call: FakeCall) => FakeResult
}) {
  const db = createFakeDb((call) => {
    if (isPendingLookup(call)) return { data: options.pending ?? [], error: null }
    if (isCurrentLookup(call)) return { data: options.current ?? [], error: null }
    if (isClaimUpdate(call)) {
      return options.claimUpdate?.(call) ?? { data: { id: eqValue(call, 'id') }, error: null }
    }
    return { data: null, error: null }
  })
  return { db, client: createFakeClient(db) as unknown as Client }
}

describe('claimPendingSlots (shadow member activation)', () => {
  it('ignores an unverified email: requesting a sign-in code proves nothing', async () => {
    const { db, client } = setup({ pending: [slot('m1', 'leader')] })

    const result = await claimPendingSlots(client, { ...USER, email_confirmed_at: undefined })

    expect(result.claimed).toEqual([])
    expect(db.calls).toEqual([])
  })

  it('looks the slot up by the lowercased email and only among unclaimed, active slots', async () => {
    const { db, client } = setup({})

    await claimPendingSlots(client, USER)

    const lookup = db.calls.find(isPendingLookup)!
    expect(eqValue(lookup, 'claim_email')).toBe('ketua@sekolah.sch.id')
    expect(eqValue(lookup, 'status')).toBe('active')
    expect(lookup.filters).toContainEqual({ method: 'is', args: ['user_id', null] })
    // Nothing pending: no further queries.
    expect(db.calls).toHaveLength(1)
  })

  it('claims a leader slot, sets the team leader and fills only empty profile fields', async () => {
    const { db, client } = setup({ pending: [slot('m1', 'leader')] })

    const result = await claimPendingSlots(client, USER)

    expect(result.claimed).toEqual(['m1'])

    const [claim] = writesTo(db, 'competition_team_members')
    expect(claim.payload).toMatchObject({ user_id: 'user-1', email: 'ketua@sekolah.sch.id' })
    // Conditional update: a concurrent claim cannot overwrite the owner.
    expect(claim.filters).toContainEqual({ method: 'is', args: ['user_id', null] })

    const [team] = writesTo(db, 'competition_teams')
    expect(team.payload).toEqual({ leader_user_id: 'user-1' })
    expect(team.filters).toContainEqual({ method: 'is', args: ['leader_user_id', null] })

    const profile = writesTo(db, 'profiles')
    expect(profile.map((call) => call.payload)).toEqual([
      { phone: '081234567890' },
      { institution: 'SMA Negeri 1 Bandung' },
      { full_name: 'Budi Santoso' },
    ])
    expect(profile[0].filters).toContainEqual({ method: 'is', args: ['phone', null] })
    expect(eqValue(profile[2], 'full_name')).toBe(USER.email)
  })

  it('claims a member slot without touching the team leader', async () => {
    const { db, client } = setup({ pending: [slot('m2', 'member')] })

    const result = await claimPendingSlots(client, USER)

    expect(result.claimed).toEqual(['m2'])
    expect(writesTo(db, 'competition_teams')).toEqual([])
  })

  it('skips a slot in a competition the user already plays', async () => {
    const { db, client } = setup({
      pending: [slot('m1', 'member')],
      current: [{ team_id: 'other', competition_teams: { competition_id: 'comp-oe' } }],
    })

    const result = await claimPendingSlots(client, USER)

    expect(result).toEqual({ claimed: [], skipped: [{ memberId: 'm1', reason: 'ALREADY_IN_COMPETITION' }] })
    expect(writesTo(db, 'competition_team_members')).toEqual([])
  })

  it('takes only one slot per competition when the email waits in two teams', async () => {
    const { client } = setup({ pending: [slot('m1', 'leader', 'comp-oe', 'team-a'), slot('m2', 'member', 'comp-oe', 'team-b')] })

    const result = await claimPendingSlots(client, USER)

    expect(result.claimed).toEqual(['m1'])
    expect(result.skipped).toEqual([{ memberId: 'm2', reason: 'ALREADY_IN_COMPETITION' }])
  })

  it('reports a slot someone else claimed first', async () => {
    const { db, client } = setup({ pending: [slot('m1', 'leader')], claimUpdate: () => ({ data: null, error: null }) })

    const result = await claimPendingSlots(client, USER)

    expect(result).toEqual({ claimed: [], skipped: [{ memberId: 'm1', reason: 'ALREADY_CLAIMED' }] })
    expect(writesTo(db, 'competition_teams')).toEqual([])
    expect(writesTo(db, 'profiles')).toEqual([])
  })

  it('is idempotent: a second run finds nothing pending', async () => {
    const { db, client } = setup({ pending: [] })

    expect(await claimPendingSlots(client, USER)).toEqual({ claimed: [], skipped: [] })
    expect(db.calls.filter((call) => call.op !== 'select')).toEqual([])
  })
})

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Siti.Aisyah@GMAIL.com ')).toBe('siti.aisyah@gmail.com')
  })
})
