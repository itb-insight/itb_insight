import { type NextRequest } from 'next/server'

import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { parseTextFields, PROFILE_LIMITS } from '@/lib/input'
import { checkRateLimit, rateLimitResponse, sensitiveMutationRateLimit } from '@/lib/rate-limit'
import { ensureTeamProfile, findUserTeamForCompetition, getTeamCompetition } from '@/lib/team-registration'
import { createServiceClient } from '@/lib/supabase/server'
import { generateTeamUid } from '@/lib/teams'

type TeamCreatePayload = {
  competitionSlug?: string
  teamName?: string
  name?: string
  phoneNumber?: string
  institution?: string
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)

  if (!auth.ok) return unauthorizedResponse()

  const rateLimit = checkRateLimit(request, {
    scope: 'team-create',
    identity: auth.user.id,
    ...sensitiveMutationRateLimit,
  })

  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfterSeconds)

  let payload: TeamCreatePayload

  try {
    payload = (await request.json()) as TeamCreatePayload
  } catch {
    return apiError('INVALID_JSON', 'Format request tidak valid.', 400)
  }

  const fields = parseTextFields(payload, { competitionSlug: 100, teamName: 80, ...PROFILE_LIMITS })
  if (!fields.ok) return apiError('INVALID_INPUT', `Kolom ${fields.field} tidak valid.`, 400)
  const { competitionSlug, teamName } = fields.values

  if (!competitionSlug) return apiError('COMPETITION_REQUIRED', 'Kompetisi wajib dipilih.', 400)
  if (!teamName) return apiError('TEAM_NAME_REQUIRED', 'Nama tim wajib diisi.', 400)

  const competitionResult = await getTeamCompetition(competitionSlug)
  if (!competitionResult.ok) return apiError(competitionResult.code, competitionResult.message, competitionResult.status)

  const { competition } = competitionResult
  const supabase = createServiceClient()
  const profileResult = await ensureTeamProfile(supabase, auth.user, fields.values)

  if (!profileResult.ok) return profileResult.response

  const existingMembership = await findUserTeamForCompetition(supabase, auth.user.id, competition.id)

  if (existingMembership.error) {
    return apiError('TEAM_LOOKUP_FAILED', 'Gagal memeriksa tim sebelumnya.', 500)
  }

  if (existingMembership.data) {
    return apiError('USER_ALREADY_IN_TEAM', 'Akun ini sudah tergabung dalam tim untuk kompetisi ini.', 409)
  }

  let createdTeam: { id: string; team_uid: string; team_name: string; status: string } | null = null
  let insertErrorCode: string | undefined

  for (let attempt = 0; attempt < 5 && !createdTeam; attempt += 1) {
    const teamUid = generateTeamUid(competition.team_uid_prefix || '')
    const { data, error } = await supabase
      .from('competition_teams')
      .insert({
        competition_id: competition.id,
        team_uid: teamUid,
        team_name: teamName,
        leader_user_id: auth.user.id,
        status: 'draft',
      })
      .select('id, team_uid, team_name, status')
      .single()

    if (!error && data) {
      createdTeam = data
      break
    }

    insertErrorCode = error?.code
    if (error?.code !== '23505') break
  }

  if (!createdTeam) {
    if (insertErrorCode === '23505') {
      return apiError('TEAM_ALREADY_EXISTS', 'Nama atau UID tim sudah digunakan.', 409)
    }

    return apiError('TEAM_CREATE_FAILED', 'Gagal membuat tim.', 500)
  }

  const { profile } = profileResult
  const { data: member, error: memberError } = await supabase
    .from('competition_team_members')
    .insert({
      team_id: createdTeam.id,
      user_id: auth.user.id,
      name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      institution: profile.institution,
      member_role: 'leader',
    })
    .select('id, name, email, phone, institution, member_role, joined_at')
    .single()

  if (memberError || !member) {
    const { error: deleteError } = await supabase.from('competition_teams').delete().eq('id', createdTeam.id)
    if (deleteError) {
      console.error('Gagal menghapus tim yatim:', createdTeam.id, deleteError)
    }
    return apiError('TEAM_MEMBER_CREATE_FAILED', 'Gagal menambahkan leader ke tim.', 500)
  }

  return apiSuccess({ team: { ...createdTeam, competitionSlug: competition.slug, member } }, 201)
}
