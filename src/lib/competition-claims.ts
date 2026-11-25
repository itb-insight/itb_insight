import 'server-only'

import { type User } from '@supabase/supabase-js'

import { createServiceClient } from '@/lib/supabase/server'

type ServiceClient = ReturnType<typeof createServiceClient>
type ClaimSubject = Pick<User, 'id' | 'email' | 'email_confirmed_at'>

export type ClaimResult = {
  /** Member rows that now belong to the user. */
  claimed: string[]
  /** Slots matching the email that were left alone, with the reason. */
  skipped: Array<{ memberId: string; reason: 'ALREADY_IN_COMPETITION' | 'ALREADY_CLAIMED' | 'FAILED' }>
}

type PendingSlot = {
  id: string
  team_id: string
  member_role: 'leader' | 'member'
  name: string
  phone: string | null
  institution: string
  competition_teams: { id: string; competition_id: string; status: string } | null
}

/** The form for every email we store or compare: trimmed and lowercased. */
export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

/**
 * Activates the shadow slots (0014) waiting for this user's email: imported teams list people by
 * email before they have an account, and the first verified sign-in with that email takes the
 * slot. Safe to call on every request; it costs one indexed query when nothing is pending.
 *
 * Only a verified email counts. Supabase creates the auth user when a sign-in code is *requested*,
 * before the address is proven, and anyone can request one for any address.
 */
export async function claimPendingSlots(supabase: ServiceClient, user: ClaimSubject): Promise<ClaimResult> {
  const result: ClaimResult = { claimed: [], skipped: [] }
  if (!user.email || !user.email_confirmed_at) return result

  const email = normalizeEmail(user.email)

  const { data: pending, error } = await supabase
    .from('competition_team_members')
    .select('id, team_id, member_role, name, phone, institution, competition_teams!inner(id, competition_id, status)')
    .eq('claim_email', email)
    .is('user_id', null)
    .eq('status', 'active')
    .order('slot', { ascending: true })

  if (error || !pending?.length) return result

  const slots = pending as unknown as PendingSlot[]

  // One team per competition: skip a slot when the user already plays that competition.
  const { data: current } = await supabase
    .from('competition_team_members')
    .select('team_id, competition_teams!inner(competition_id)')
    .eq('user_id', user.id)
    .eq('status', 'active')

  const taken = new Set(
    ((current || []) as unknown as Array<{ competition_teams: { competition_id: string } | null }>)
      .map((row) => row.competition_teams?.competition_id)
      .filter(Boolean),
  )

  let profileSource: PendingSlot | null = null

  for (const slot of slots) {
    const competitionId = slot.competition_teams?.competition_id
    if (!competitionId || taken.has(competitionId)) {
      result.skipped.push({ memberId: slot.id, reason: 'ALREADY_IN_COMPETITION' })
      continue
    }

    // `user_id is null` in the filter makes the claim first-come: a concurrent claim updates nothing.
    const { data: updated, error: updateError } = await supabase
      .from('competition_team_members')
      .update({ user_id: user.id, email, claimed_at: new Date().toISOString() })
      .eq('id', slot.id)
      .is('user_id', null)
      .select('id')
      .maybeSingle()

    if (updateError) {
      result.skipped.push({ memberId: slot.id, reason: 'FAILED' })
      continue
    }
    if (!updated) {
      result.skipped.push({ memberId: slot.id, reason: 'ALREADY_CLAIMED' })
      continue
    }

    taken.add(competitionId)
    result.claimed.push(slot.id)
    profileSource ??= slot

    if (slot.member_role === 'leader') {
      await supabase
        .from('competition_teams')
        .update({ leader_user_id: user.id })
        .eq('id', slot.team_id)
        .is('leader_user_id', null)
    }
  }

  if (profileSource) await fillEmptyProfile(supabase, user, profileSource)

  return result
}

/** Copies what the form knew about the person into profile fields they have not filled in yet. */
async function fillEmptyProfile(supabase: ServiceClient, user: ClaimSubject, slot: PendingSlot) {
  const updates: Array<PromiseLike<unknown>> = []

  if (slot.phone) {
    updates.push(supabase.from('profiles').update({ phone: slot.phone }).eq('id', user.id).is('phone', null))
  }
  if (slot.institution) {
    updates.push(
      supabase.from('profiles').update({ institution: slot.institution }).eq('id', user.id).is('institution', null),
    )
  }
  // handle_new_user() falls back to the email as the name when the sign-in method gives none.
  if (slot.name && user.email) {
    updates.push(supabase.from('profiles').update({ full_name: slot.name }).eq('id', user.id).eq('full_name', user.email))
  }

  await Promise.all(updates)
}
