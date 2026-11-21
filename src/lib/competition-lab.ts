import 'server-only'

import { type User } from '@supabase/supabase-js'

import { normalizeEmail } from '@/lib/competition-claims'
import { getCompetitionBySlug } from '@/lib/competitions'
import { isEmail } from '@/lib/form-import/oe-form'
import { findOrCreateCompetitionRow } from '@/lib/registrations'
import { createServiceClient } from '@/lib/supabase/server'
import type { LabTeam } from '@/features/admin/competition-lab/types'
import { generateTeamUid } from '@/lib/teams'

/*
  Admin test lab for competition teams (/admin/competition). Creates teams with source = 'test'
  that behave like imported ones (shadow slots claimable by email), and every write here is
  limited to source = 'test': the lab cannot touch imported or real teams.
*/

type ServiceClient = ReturnType<typeof createServiceClient>

export type { LabTeam }

export type SeedInput = {
  competitionSlug: string
  teamName: string
  school: string
  members: Array<{ name: string; email: string | null }>
}

export type LabResult<T> = { ok: true; data: T } | { ok: false; code: Uppercase<string>; message: string; status: number }

const fail = (code: Uppercase<string>, message: string, status = 400) => ({ ok: false as const, code, message, status })

export async function listLabTeams(supabase: ServiceClient): Promise<LabTeam[]> {
  const { data, error } = await supabase
    .from('competition_teams')
    .select(
      'id, team_uid, team_name, status, created_at, competitions(name), competition_team_members(slot, member_role, name, claim_email, user_id, status)',
    )
    .eq('source', 'test')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  type Row = {
    id: string
    team_uid: string
    team_name: string
    status: string
    created_at: string
    competitions: { name: string } | null
    competition_team_members: Array<{
      slot: number | null
      member_role: string
      name: string
      claim_email: string | null
      user_id: string | null
      status: string
    }>
  }

  return ((data ?? []) as unknown as Row[]).map((team) => ({
    id: team.id,
    teamUid: team.team_uid,
    teamName: team.team_name,
    status: team.status,
    competitionName: team.competitions?.name ?? '-',
    createdAt: team.created_at,
    members: [...team.competition_team_members]
      .sort((a, b) => (a.slot ?? 99) - (b.slot ?? 99))
      .map((member) => ({
        slot: member.slot,
        role: member.member_role,
        name: member.name,
        claimEmail: member.claim_email,
        claimed: Boolean(member.user_id),
        status: member.status,
      })),
  }))
}

/** A verified test team with shadow slots, like an imported one. Slot 1 is the leader. */
export async function seedLabTeam(supabase: ServiceClient, input: SeedInput): Promise<LabResult<{ teamId: string; teamUid: string }>> {
  const catalog = await getCompetitionBySlug(input.competitionSlug)
  if (!catalog || catalog.registrationType !== 'team') return fail('COMPETITION_INVALID', 'Pilih lomba beregu.')

  const members = input.members.filter((member) => member.name)
  if (!members.length || !input.members[0]?.name) return fail('LEADER_REQUIRED', 'Nama ketua wajib diisi.')
  if (members.length > (catalog.teamMax ?? 3)) return fail('TOO_MANY_MEMBERS', `Maksimal ${catalog.teamMax} orang.`)

  const emails = members.map((member) => (member.email ? normalizeEmail(member.email) : null))
  if (emails.some((email) => email && !isEmail(email))) return fail('INVALID_EMAIL', 'Ada email yang tidak valid.')
  const filled = emails.filter(Boolean)
  if (new Set(filled).size !== filled.length) return fail('DUPLICATE_EMAIL', 'Email tiap anggota harus berbeda.')

  const competitionResult = await findOrCreateCompetitionRow(input.competitionSlug)
  if (!competitionResult.ok) return fail(competitionResult.code as Uppercase<string>, competitionResult.message, competitionResult.status)
  const competition = competitionResult.competition

  let team: { id: string; team_uid: string } | null = null
  for (let attempt = 0; attempt < 5 && !team; attempt += 1) {
    const { data, error } = await supabase
      .from('competition_teams')
      .insert({
        competition_id: competition.id,
        team_uid: generateTeamUid(competition.team_uid_prefix || catalog.teamUidPrefix || 'TST'),
        team_name: input.teamName,
        leader_user_id: null,
        status: 'verified',
        source: 'test',
      })
      .select('id, team_uid')
      .single()
    if (data) team = data
    else if (error?.code !== '23505') return fail('TEAM_CREATE_FAILED', error?.message ?? 'Gagal membuat tim.', 500)
  }
  if (!team) return fail('TEAM_CREATE_FAILED', 'Gagal membuat kode tim.', 500)

  const { error: membersError } = await supabase.from('competition_team_members').insert(
    members.map((member, index) => ({
      team_id: team.id,
      user_id: null,
      slot: index + 1,
      member_role: index === 0 ? 'leader' : 'member',
      name: member.name,
      institution: input.school,
      email: null,
      phone: null,
      claim_email: emails[index],
    })),
  )

  const { error: registrationError } = membersError
    ? { error: membersError }
    : await supabase.from('competition_registrations').insert({
        competition_id: competition.id,
        registration_kind: 'team',
        team_id: team.id,
        status: 'verified',
        note: 'Admin test lab',
      })

  if (membersError || registrationError) {
    await deleteLabTeams(supabase, [team.id])
    return fail('TEAM_CREATE_FAILED', (membersError ?? registrationError)?.message ?? 'Gagal membuat tim.', 500)
  }

  return { ok: true, data: { teamId: team.id, teamUid: team.team_uid } }
}

/** Gives back every test-team slot this user holds, so the claim can be tried again. */
export async function releaseLabSlots(supabase: ServiceClient, user: Pick<User, 'id'>): Promise<LabResult<{ released: number }>> {
  const { data: teams, error } = await supabase.from('competition_teams').select('id').eq('source', 'test')
  if (error) return fail('LAB_LOOKUP_FAILED', error.message, 500)
  const ids = (teams ?? []).map((team) => team.id as string)
  if (!ids.length) return { ok: true, data: { released: 0 } }

  const { data: released, error: releaseError } = await supabase
    .from('competition_team_members')
    .update({ user_id: null, claimed_at: null, email: null })
    .in('team_id', ids)
    .eq('user_id', user.id)
    .select('id')
  if (releaseError) return fail('RELEASE_FAILED', releaseError.message, 500)

  await supabase.from('competition_teams').update({ leader_user_id: null }).in('id', ids).eq('leader_user_id', user.id)
  return { ok: true, data: { released: released?.length ?? 0 } }
}

/** Deletes test teams (all of them when `teamIds` is omitted). Never touches other sources. */
export async function deleteLabTeams(supabase: ServiceClient, teamIds?: string[]): Promise<LabResult<{ deleted: number }>> {
  let query = supabase.from('competition_teams').select('id').eq('source', 'test')
  if (teamIds) query = query.in('id', teamIds)
  const { data, error } = await query
  if (error) return fail('LAB_LOOKUP_FAILED', error.message, 500)

  const ids = (data ?? []).map((team) => team.id as string)
  if (!ids.length) return { ok: true, data: { deleted: 0 } }

  // Registrations do not cascade from teams (payments cascade from registrations).
  const { error: registrationError } = await supabase.from('competition_registrations').delete().in('team_id', ids)
  if (registrationError) return fail('RESET_FAILED', registrationError.message, 500)
  const { error: teamError } = await supabase.from('competition_teams').delete().in('id', ids).eq('source', 'test')
  if (teamError) return fail('RESET_FAILED', teamError.message, 500)

  return { ok: true, data: { deleted: ids.length } }
}

/** Team ids for the preview box: a team code, or an email on any slot (claim or account email). */
export async function findTeamIds(supabase: ServiceClient, query: string): Promise<string[]> {
  const value = query.trim()
  if (!value) return []

  if (value.includes('@')) {
    const email = normalizeEmail(value)
    const [byClaim, byEmail] = await Promise.all([
      supabase.from('competition_team_members').select('team_id').eq('claim_email', email).limit(10),
      supabase.from('competition_team_members').select('team_id').eq('email', email).limit(10),
    ])
    return [...new Set([...(byClaim.data ?? []), ...(byEmail.data ?? [])].map((row) => row.team_id as string))]
  }

  const { data } = await supabase.from('competition_teams').select('id').eq('team_uid', value.toUpperCase().replace(/\s+/g, '')).limit(1)
  return (data ?? []).map((row) => row.id as string)
}
