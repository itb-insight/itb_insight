import { describe, expect, it } from 'vitest'

import { getCompetition } from '@/features/competition/data'

import { createFakeClient, createFakeDb, type FakeCall } from '../../tests/support/fake-supabase'

import { contactActions, getActivityForTeams, nextStage, whatsappLink } from './dashboard-activity'

type Client = Parameters<typeof getActivityForTeams>[0]

describe('contactActions (from each competition page)', () => {
  it('Olimpiade Engineering: its one WhatsApp contact person, nothing else', async () => {
    expect(contactActions(await getCompetition('olimpiade-engineering'))).toEqual([
      { label: 'WhatsApp Contact Person', href: 'https://wa.me/6281343256927', icon: '/images/bg-home/Whatsapp.png' },
    ])
  })

  it('Drone Soccer: Line and WhatsApp for each named contact', async () => {
    const actions = contactActions(await getCompetition('microdrone-obstacle-race'))
    expect(actions.map((a) => a.label)).toEqual(['Line Devan', 'WhatsApp Devan', 'Line Jericko', 'WhatsApp Jericko'])
    expect(actions[0].href).toBe('https://line.me/ti/p/~devanaqila')
    expect(actions[1].href).toBe('https://wa.me/6281380181827')
  })

  it('no link, no button: group and Discord stay hidden until the competition has them', async () => {
    const base = (await getCompetition('olimpiade-engineering'))!
    expect(contactActions({ ...base, contactUrl: null })).toEqual([])
    expect(contactActions({ ...base, contactUrl: '#kontak' })).toEqual([])
    expect(
      contactActions({ ...base, contactUrl: null, community: { whatsappGroupUrl: 'https://chat.whatsapp.com/abc', discordUrl: 'javascript:alert(1)' } }),
    ).toEqual([{ label: 'Grup Whatsapp', href: 'https://chat.whatsapp.com/abc', icon: '/images/bg-home/Whatsapp.png' }])
  })

  it('formats local WhatsApp numbers for wa.me', () => {
    expect(whatsappLink('0813-4325-6927')).toBe('https://wa.me/6281343256927')
  })
})

describe('nextStage', () => {
  it('is the first timeline stage on or after today in Jakarta', async () => {
    const oe = await getCompetition('olimpiade-engineering')
    // 2026-11-22 10:00 WIB: registration is over, the semifinal is next.
    expect(nextStage(oe, Date.parse('2026-11-22T03:00:00Z'))).toEqual({ label: 'Semifinal', date: '27 November 2026' })
    // 2026-11-28 00:30 WIB is already the 28th in Jakarta (still the 27th in UTC).
    expect(nextStage(oe, Date.parse('2026-11-27T17:30:00Z'))).toEqual({ label: 'Final & Awarding', date: '28 November 2026' })
    expect(nextStage(oe, Date.parse('2026-12-01T00:00:00Z'))).toBeNull()
  })
})

describe('getActivityForTeams', () => {
  const team = {
    id: 'team-1',
    team_uid: 'OE-ABC123',
    team_name: 'Tim Elang',
    status: 'verified',
    created_at: '2026-09-01T00:00:00Z',
    competitions: { slug: 'olimpiade-engineering', name: 'Olimpiade Engineering', category: 'olimpiade' },
  }
  const members = [
    { id: 'm3', team_id: 'team-1', slot: 3, member_role: 'member', name: 'Citra', institution: 'SMA 1', user_id: null, claim_email: null, joined_at: 'a' },
    { id: 'm1', team_id: 'team-1', slot: 1, member_role: 'leader', name: 'Andi', institution: 'SMA 1', user_id: 'leader-user', claim_email: 'andi@x.id', joined_at: 'a' },
    { id: 'm2', team_id: 'team-1', slot: 2, member_role: 'member', name: 'Budi', institution: 'SMA 1', user_id: null, claim_email: 'budi@x.id', joined_at: 'a' },
  ]

  function client(teamOverrides: Partial<typeof team> = {}) {
    const db = createFakeDb((call: FakeCall) => {
      if (call.table === 'competition_teams') return { data: [{ ...team, ...teamOverrides }], error: null }
      if (call.table === 'competition_team_members') return { data: members, error: null }
      return { data: null, error: null }
    })
    return { db, client: createFakeClient(db) as unknown as Client }
  }

  const NOW = Date.parse('2026-11-22T03:00:00Z')

  it('lists the leader first, then members by slot, with their shadow state', async () => {
    const [entry] = await getActivityForTeams(client().client, ['team-1'], { now: NOW, viewerUserId: 'leader-user' })

    expect(entry.members.map((m) => [m.role, m.name, m.state, m.isYou])).toEqual([
      ['Ketua:', 'Andi', 'active', true],
      ['Anggota 1:', 'Budi', 'invited', false],
      ['Anggota 2:', 'Citra', 'unclaimed', false],
    ])
    expect(entry).toMatchObject({ teamName: 'Tim Elang', institution: 'Sekolah: SMA 1', viewerIsLeader: true, withdrawn: false })
  })

  it('shows pending invite emails to the leader only', async () => {
    const [asLeader] = await getActivityForTeams(client().client, ['team-1'], { now: NOW, viewerUserId: 'leader-user' })
    const [asMember] = await getActivityForTeams(client().client, ['team-1'], { now: NOW, viewerUserId: 'someone-else' })

    expect(asLeader.members.find((m) => m.id === 'm2')?.inviteEmail).toBe('budi@x.id')
    // The leader's own (claimed) row never carries an email.
    expect(asLeader.members.find((m) => m.id === 'm1')).not.toHaveProperty('inviteEmail')
    expect(asMember.viewerIsLeader).toBe(false)
    expect(asMember.members.every((m) => !('inviteEmail' in m))).toBe(true)
  })

  it('reads only active member rows', async () => {
    const { db, client: c } = client()
    await getActivityForTeams(c, ['team-1'], { now: NOW, viewerUserId: 'leader-user' })
    const memberQuery = db.calls.find((call) => call.table === 'competition_team_members')!
    expect(memberQuery.filters).toContainEqual({ method: 'eq', args: ['status', 'active'] })
  })

  it('marks a withdrawn team and drops its upcoming stage', async () => {
    const [entry] = await getActivityForTeams(client({ status: 'withdrawn' }).client, ['team-1'], { now: NOW, viewerUserId: 'leader-user' })
    expect(entry).toMatchObject({ withdrawn: true, statusLabel: 'Mengundurkan diri', nextStage: null })
  })

  it('queries nothing for a user without teams', async () => {
    const { db, client: c } = client()
    expect(await getActivityForTeams(c, [], { now: NOW, viewerUserId: 'x' })).toEqual([])
    expect(db.calls).toEqual([])
  })
})
