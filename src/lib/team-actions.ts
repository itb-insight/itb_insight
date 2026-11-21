import 'server-only'

import { type User } from '@supabase/supabase-js'

import { normalizeEmail } from '@/lib/competition-claims'
import { isEmail } from '@/lib/form-import/oe-form'
import { createServiceClient } from '@/lib/supabase/server'

/*
  What a member can do with a team on /dashboard (0014). Teams registered on the form, so:
  no renaming the team and no removing someone else. The leader can invite an email onto an
  empty slot and hand leadership to a member who has joined; anyone can withdraw (a member leaves
  the team; the leader withdraws the whole team). Every check is made here, from the session
  user and the database — never from what the client says about roles.
*/

type ServiceClient = ReturnType<typeof createServiceClient>
type Actor = Pick<User, 'id' | 'email'>

export type ActionResult<T = Record<string, never>> =
  | { ok: true; data: T }
  | { ok: false; code: Uppercase<string>; message: string; status: number }

const fail = (code: Uppercase<string>, message: string, status = 400) => ({ ok: false as const, code, message, status })

/** Word the user types to confirm a withdrawal (checked again here, not only in the dialog). */
export const WITHDRAW_CONFIRMATION = 'MUNDUR'

type TeamContext = {
  team: { id: string; competition_id: string; status: string; team_name: string }
  me: { id: string; member_role: 'leader' | 'member' }
}

/** The team and the actor's own active row in it, or why they cannot act on it. */
async function loadContext(supabase: ServiceClient, teamId: string, actor: Actor): Promise<ActionResult<TeamContext>> {
  const [teamResult, meResult] = await Promise.all([
    supabase.from('competition_teams').select('id, competition_id, status, team_name').eq('id', teamId).maybeSingle(),
    supabase
      .from('competition_team_members')
      .select('id, member_role')
      .eq('team_id', teamId)
      .eq('user_id', actor.id)
      .eq('status', 'active')
      .maybeSingle(),
  ])

  if (teamResult.error || meResult.error) return fail('TEAM_LOOKUP_FAILED', 'Gagal memuat tim.', 500)
  // Same answer for "no such team" and "not your team": team ids are not to be probed.
  if (!teamResult.data || !meResult.data) return fail('TEAM_NOT_FOUND', 'Tim tidak ditemukan.', 404)
  if (teamResult.data.status === 'withdrawn') return fail('TEAM_WITHDRAWN', 'Tim ini sudah mengundurkan diri.', 409)

  return { ok: true, data: { team: teamResult.data, me: meResult.data as TeamContext['me'] } }
}

const leaderOnly = () => fail('LEADER_ONLY', 'Hanya ketua tim yang bisa melakukan ini.', 403)

/**
 * Leader: put an email on an empty member slot (or change/clear it while nobody has claimed it).
 * The slot is claimed when that email signs in (claimPendingSlots).
 */
export async function inviteToSlot(
  supabase: ServiceClient,
  actor: Actor,
  input: { teamId: string; memberId: string; email: string | null },
): Promise<ActionResult<{ email: string | null }>> {
  const context = await loadContext(supabase, input.teamId, actor)
  if (!context.ok) return context
  if (context.data.me.member_role !== 'leader') return leaderOnly()

  const email = input.email ? normalizeEmail(input.email) : null
  if (email && !isEmail(email)) return fail('INVALID_EMAIL', 'Format email tidak valid.')
  if (email && actor.email && email === normalizeEmail(actor.email)) {
    return fail('OWN_EMAIL', 'Itu email akunmu sendiri. Undang email anggota tersebut.')
  }

  const { data: slot, error: slotError } = await supabase
    .from('competition_team_members')
    .select('id, member_role, user_id, status')
    .eq('id', input.memberId)
    .eq('team_id', input.teamId)
    .maybeSingle()
  if (slotError) return fail('TEAM_LOOKUP_FAILED', 'Gagal memuat anggota.', 500)
  if (!slot || slot.status !== 'active' || slot.member_role !== 'member') return fail('SLOT_NOT_FOUND', 'Slot anggota tidak ditemukan.', 404)
  if (slot.user_id) return fail('SLOT_TAKEN', 'Anggota ini sudah bergabung; undangannya tidak bisa diubah.', 409)

  if (email) {
    // Not already someone else's slot in this team, nor a member (or invite) of another team
    // in the same competition: the claim would skip it and the leader would never know why.
    // Imported slots keep the address in claim_email; slots created on the site in email.
    const inOtherTeam = (column: 'claim_email' | 'email') =>
      supabase
        .from('competition_team_members')
        .select('id, competition_teams!inner(competition_id, status)')
        .eq('competition_teams.competition_id', context.data.team.competition_id)
        .neq('competition_teams.status', 'withdrawn')
        .neq('team_id', input.teamId)
        .eq('status', 'active')
        .eq(column, email)
        .limit(1)

    const [inTeam, byClaim, byEmail] = await Promise.all([
      supabase
        .from('competition_team_members')
        .select('id')
        .eq('team_id', input.teamId)
        .eq('claim_email', email)
        .neq('id', input.memberId)
        .limit(1),
      inOtherTeam('claim_email'),
      inOtherTeam('email'),
    ])
    if (inTeam.error || byClaim.error || byEmail.error) return fail('TEAM_LOOKUP_FAILED', 'Gagal memeriksa email.', 500)
    if (inTeam.data?.length) return fail('EMAIL_IN_TEAM', 'Email ini sudah dipakai anggota lain di timmu.', 409)
    if (byClaim.data?.length || byEmail.data?.length) {
      return fail('EMAIL_IN_OTHER_TEAM', 'Email ini sudah terdaftar di tim lain untuk lomba ini.', 409)
    }
  }

  // `user_id is null`: if the member claimed the slot meanwhile, nothing changes.
  const { data: updated, error } = await supabase
    .from('competition_team_members')
    .update({ claim_email: email })
    .eq('id', input.memberId)
    .eq('team_id', input.teamId)
    .is('user_id', null)
    .select('id')
    .maybeSingle()

  if (error) {
    return error.code === '23505'
      ? fail('EMAIL_IN_TEAM', 'Email ini sudah dipakai anggota lain di timmu.', 409)
      : fail('INVITE_FAILED', 'Gagal menyimpan undangan.', 500)
  }
  if (!updated) return fail('SLOT_TAKEN', 'Anggota ini baru saja bergabung.', 409)

  return { ok: true, data: { email } }
}

/** Leader: hand leadership to a member who has joined (has an account on the slot). */
export async function transferLeadership(
  supabase: ServiceClient,
  actor: Actor,
  input: { teamId: string; memberId: string },
): Promise<ActionResult<{ leaderMemberId: string }>> {
  const context = await loadContext(supabase, input.teamId, actor)
  if (!context.ok) return context
  const { me } = context.data
  if (me.member_role !== 'leader') return leaderOnly()
  if (me.id === input.memberId) return fail('ALREADY_LEADER', 'Kamu sudah menjadi ketua.')

  const { data: target, error: targetError } = await supabase
    .from('competition_team_members')
    .select('id, user_id, member_role, status')
    .eq('id', input.memberId)
    .eq('team_id', input.teamId)
    .maybeSingle()
  if (targetError) return fail('TEAM_LOOKUP_FAILED', 'Gagal memuat anggota.', 500)
  if (!target || target.status !== 'active' || target.member_role !== 'member') return fail('SLOT_NOT_FOUND', 'Anggota tidak ditemukan.', 404)
  if (!target.user_id) return fail('MEMBER_NOT_JOINED', 'Anggota ini belum bergabung, jadi belum bisa menjadi ketua.', 409)

  // One leader per team is a unique index, so: step down first, then promote. Undo on failure.
  const { data: steppedDown, error: downError } = await supabase
    .from('competition_team_members')
    .update({ member_role: 'member' })
    .eq('id', me.id)
    .eq('member_role', 'leader')
    .select('id')
    .maybeSingle()
  if (downError || !steppedDown) return fail('TRANSFER_FAILED', 'Gagal mengganti ketua.', 500)

  const { data: promoted, error: upError } = await supabase
    .from('competition_team_members')
    .update({ member_role: 'leader' })
    .eq('id', target.id)
    .eq('status', 'active')
    .select('id')
    .maybeSingle()

  if (upError || !promoted) {
    await supabase.from('competition_team_members').update({ member_role: 'leader' }).eq('id', me.id)
    return fail('TRANSFER_FAILED', 'Gagal mengganti ketua.', 500)
  }

  await supabase.from('competition_teams').update({ leader_user_id: target.user_id }).eq('id', input.teamId)
  return { ok: true, data: { leaderMemberId: target.id } }
}

/**
 * Withdraw. A member leaves the team (their slot is closed; the team carries on). The leader
 * withdraws the whole team: team and registration become 'withdrawn'. Not undoable by the user.
 */
export async function withdraw(
  supabase: ServiceClient,
  actor: Actor,
  input: { teamId: string; confirmation: string },
): Promise<ActionResult<{ scope: 'member' | 'team' }>> {
  if (input.confirmation !== WITHDRAW_CONFIRMATION) {
    return fail('CONFIRMATION_REQUIRED', `Ketik ${WITHDRAW_CONFIRMATION} untuk mengonfirmasi.`)
  }

  const context = await loadContext(supabase, input.teamId, actor)
  if (!context.ok) return context
  const now = new Date().toISOString()

  if (context.data.me.member_role === 'member') {
    const { error } = await supabase
      .from('competition_team_members')
      .update({ status: 'withdrawn', withdrawn_at: now })
      .eq('id', context.data.me.id)
      .eq('status', 'active')
    if (error) return fail('WITHDRAW_FAILED', 'Gagal mengundurkan diri.', 500)
    return { ok: true, data: { scope: 'member' } }
  }

  const { error: teamError } = await supabase
    .from('competition_teams')
    .update({ status: 'withdrawn', withdrawn_at: now })
    .eq('id', input.teamId)
    .neq('status', 'withdrawn')
  if (teamError) return fail('WITHDRAW_FAILED', 'Gagal mengundurkan tim.', 500)

  const { error: registrationError } = await supabase
    .from('competition_registrations')
    .update({ status: 'withdrawn' })
    .eq('team_id', input.teamId)
  if (registrationError) return fail('WITHDRAW_FAILED', 'Tim mundur, tetapi status pendaftaran gagal diperbarui. Hubungi panitia.', 500)

  return { ok: true, data: { scope: 'team' } }
}
