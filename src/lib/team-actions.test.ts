import { describe, expect, it } from 'vitest'

import { createFakeClient, createFakeDb, eqValue, writesTo, type FakeCall, type FakeResult } from '../../tests/support/fake-supabase'

import { inviteToSlot, transferLeadership, withdraw } from './team-actions'

type Client = Parameters<typeof inviteToSlot>[0]

const TEAM = '11111111-1111-1111-1111-111111111111'
const LEADER = { id: 'leader-user', email: 'Ketua@Sekolah.id' }
const MEMBER = { id: 'member-user', email: 'anggota@sekolah.id' }

type Row = { id: string; user_id: string | null; member_role: 'leader' | 'member'; status: string }

const ROSTER: Row[] = [
  { id: 'slot-1', user_id: 'leader-user', member_role: 'leader', status: 'active' },
  { id: 'slot-2', user_id: 'member-user', member_role: 'member', status: 'active' },
  { id: 'slot-3', user_id: null, member_role: 'member', status: 'active' },
]

/** A small in-memory team: answers the reads team-actions makes; writes succeed unless overridden. */
function setup(options: {
  teamStatus?: string
  roster?: Row[]
  otherTeamHasEmail?: boolean
  onWrite?: (call: FakeCall) => FakeResult | undefined
} = {}) {
  const roster = options.roster ?? ROSTER
  const db = createFakeDb((call) => {
    if (call.op !== 'select') {
      return options.onWrite?.(call) ?? { data: { id: eqValue(call, 'id') ?? 'x' }, error: null }
    }
    if (call.table === 'competition_teams') {
      return { data: { id: TEAM, competition_id: 'comp-oe', status: options.teamStatus ?? 'verified', team_name: 'Tim Elang' }, error: null }
    }
    if (call.table === 'competition_team_members') {
      const userId = eqValue(call, 'user_id')
      if (userId !== undefined) return { data: roster.find((r) => r.user_id === userId && r.status === 'active') ?? null, error: null }
      const id = eqValue(call, 'id')
      if (id !== undefined) return { data: roster.find((r) => r.id === id) ?? null, error: null }
      // Duplicate-email lookups: in this team (team_id filter) or in other teams of the competition.
      const otherTeams = call.filters.some((f) => f.method === 'neq' && f.args[0] === 'team_id')
      return { data: otherTeams && options.otherTeamHasEmail ? [{ id: 'elsewhere' }] : [], error: null }
    }
    return { data: null, error: null }
  })
  return { db, client: createFakeClient(db) as unknown as Client }
}

describe('inviteToSlot', () => {
  it('lets the leader put a lowercased email on an empty member slot, only while unclaimed', async () => {
    const { db, client } = setup()
    const result = await inviteToSlot(client, LEADER, { teamId: TEAM, memberId: 'slot-3', email: ' Baru@Sekolah.ID ' })

    expect(result).toEqual({ ok: true, data: { email: 'baru@sekolah.id' } })
    const [write] = writesTo(db, 'competition_team_members')
    expect(write.payload).toEqual({ claim_email: 'baru@sekolah.id' })
    expect(write.filters).toContainEqual({ method: 'is', args: ['user_id', null] })
    expect(eqValue(write, 'team_id')).toBe(TEAM)
  })

  it('clears an invite with an empty email', async () => {
    const { db, client } = setup()
    expect(await inviteToSlot(client, LEADER, { teamId: TEAM, memberId: 'slot-3', email: null })).toMatchObject({ ok: true })
    expect(writesTo(db, 'competition_team_members')[0].payload).toEqual({ claim_email: null })
  })

  it('is leader only', async () => {
    const { db, client } = setup()
    const result = await inviteToSlot(client, MEMBER, { teamId: TEAM, memberId: 'slot-3', email: 'x@y.id' })
    expect(result).toMatchObject({ ok: false, code: 'LEADER_ONLY', status: 403 })
    expect(writesTo(db, 'competition_team_members')).toEqual([])
  })

  it('treats a team you are not in like a missing team', async () => {
    const { client } = setup()
    const result = await inviteToSlot(client, { id: 'stranger', email: 's@x.id' }, { teamId: TEAM, memberId: 'slot-3', email: 'x@y.id' })
    expect(result).toMatchObject({ ok: false, code: 'TEAM_NOT_FOUND', status: 404 })
  })

  it('refuses a slot someone already joined, the leader slot, and the leader’s own email', async () => {
    const { client } = setup()
    expect(await inviteToSlot(client, LEADER, { teamId: TEAM, memberId: 'slot-2', email: 'x@y.id' })).toMatchObject({ code: 'SLOT_TAKEN' })
    expect(await inviteToSlot(client, LEADER, { teamId: TEAM, memberId: 'slot-1', email: 'x@y.id' })).toMatchObject({ code: 'SLOT_NOT_FOUND' })
    expect(await inviteToSlot(client, LEADER, { teamId: TEAM, memberId: 'slot-3', email: 'ketua@sekolah.id' })).toMatchObject({ code: 'OWN_EMAIL' })
    expect(await inviteToSlot(client, LEADER, { teamId: TEAM, memberId: 'slot-3', email: 'nope' })).toMatchObject({ code: 'INVALID_EMAIL' })
  })

  it('refuses an email already in another team of the same competition', async () => {
    const { db, client } = setup({ otherTeamHasEmail: true })
    const result = await inviteToSlot(client, LEADER, { teamId: TEAM, memberId: 'slot-3', email: 'taken@x.id' })
    expect(result).toMatchObject({ ok: false, code: 'EMAIL_IN_OTHER_TEAM' })
    expect(writesTo(db, 'competition_team_members')).toEqual([])
  })

  it('does nothing on a withdrawn team', async () => {
    const { client } = setup({ teamStatus: 'withdrawn' })
    expect(await inviteToSlot(client, LEADER, { teamId: TEAM, memberId: 'slot-3', email: 'x@y.id' })).toMatchObject({ code: 'TEAM_WITHDRAWN' })
  })
})

describe('transferLeadership', () => {
  it('steps the leader down first, then promotes the member, then updates the team', async () => {
    const { db, client } = setup()
    const result = await transferLeadership(client, LEADER, { teamId: TEAM, memberId: 'slot-2' })

    expect(result).toEqual({ ok: true, data: { leaderMemberId: 'slot-2' } })
    const writes = db.calls.filter((call) => call.op === 'update')
    expect(writes.map((w) => [w.table, eqValue(w, 'id'), w.payload])).toEqual([
      ['competition_team_members', 'slot-1', { member_role: 'member' }],
      ['competition_team_members', 'slot-2', { member_role: 'leader' }],
      ['competition_teams', TEAM, { leader_user_id: 'member-user' }],
    ])
  })

  it('only to a member who has joined', async () => {
    const { db, client } = setup()
    const result = await transferLeadership(client, LEADER, { teamId: TEAM, memberId: 'slot-3' })
    expect(result).toMatchObject({ ok: false, code: 'MEMBER_NOT_JOINED' })
    expect(db.calls.filter((call) => call.op === 'update')).toEqual([])
  })

  it('is leader only', async () => {
    const { client } = setup()
    expect(await transferLeadership(client, MEMBER, { teamId: TEAM, memberId: 'slot-1' })).toMatchObject({ code: 'LEADER_ONLY' })
  })

  it('puts the leader back when the promotion fails', async () => {
    const { db, client } = setup({
      onWrite: (call) =>
        call.table === 'competition_team_members' && (call.payload as { member_role?: string }).member_role === 'leader' && eqValue(call, 'id') === 'slot-2'
          ? { data: null, error: { message: 'boom' } }
          : undefined,
    })

    const result = await transferLeadership(client, LEADER, { teamId: TEAM, memberId: 'slot-2' })

    expect(result).toMatchObject({ ok: false, code: 'TRANSFER_FAILED' })
    const last = db.calls.filter((call) => call.op === 'update').at(-1)!
    expect([eqValue(last, 'id'), last.payload]).toEqual(['slot-1', { member_role: 'leader' }])
    expect(writesTo(db, 'competition_teams')).toEqual([])
  })
})

describe('withdraw', () => {
  it('needs the typed confirmation before touching anything', async () => {
    const { db, client } = setup()
    expect(await withdraw(client, LEADER, { teamId: TEAM, confirmation: 'mundur?' })).toMatchObject({ code: 'CONFIRMATION_REQUIRED' })
    expect(db.calls).toEqual([])
  })

  it('a member leaves alone: only their own slot closes', async () => {
    const { db, client } = setup()
    expect(await withdraw(client, MEMBER, { teamId: TEAM, confirmation: 'MUNDUR' })).toEqual({ ok: true, data: { scope: 'member' } })

    const writes = db.calls.filter((call) => call.op !== 'select')
    expect(writes).toHaveLength(1)
    expect(writes[0].table).toBe('competition_team_members')
    expect(eqValue(writes[0], 'id')).toBe('slot-2')
    expect(writes[0].payload).toMatchObject({ status: 'withdrawn' })
  })

  it('the leader withdraws the whole team and its registration', async () => {
    const { db, client } = setup()
    expect(await withdraw(client, LEADER, { teamId: TEAM, confirmation: 'MUNDUR' })).toEqual({ ok: true, data: { scope: 'team' } })

    expect(writesTo(db, 'competition_teams')[0].payload).toMatchObject({ status: 'withdrawn' })
    const [registration] = writesTo(db, 'competition_registrations')
    expect(registration.payload).toEqual({ status: 'withdrawn' })
    expect(eqValue(registration, 'team_id')).toBe(TEAM)
    expect(writesTo(db, 'competition_team_members')).toEqual([])
  })

  it('cannot withdraw twice', async () => {
    const { client } = setup({ teamStatus: 'withdrawn' })
    expect(await withdraw(client, LEADER, { teamId: TEAM, confirmation: 'MUNDUR' })).toMatchObject({ code: 'TEAM_WITHDRAWN' })
  })
})
