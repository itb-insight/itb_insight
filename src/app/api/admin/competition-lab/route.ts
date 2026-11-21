import { type NextRequest } from 'next/server'

import { apiError, apiSuccess } from '@/lib/api-response'
import { getScopedUser } from '@/lib/admin'
import { claimPendingSlots } from '@/lib/competition-claims'
import { deleteLabTeams, releaseLabSlots, restoreLabTeam, seedLabTeam } from '@/lib/competition-lab'
import { parseTextFields, UUID_PATTERN } from '@/lib/input'
import { createServiceClient } from '@/lib/supabase/server'

/*
  Admin test lab for competition teams (/admin/competition). Admin only; every write is limited
  to teams with source = 'test' (src/lib/competition-lab.ts).

  POST { action: 'seed', competitionSlug, teamName, school, member1Name, member1Email, … member3* }
  POST { action: 'claim' }      run the sign-in claim for the calling admin now
  POST { action: 'release' }    give back the admin's test-team slots, to claim again
  POST { action: 'restore', teamId }  undo withdrawals on a test team
  POST { action: 'delete', teamId } | { action: 'reset' }
*/

const SEED_FIELDS = {
  action: 20,
  competitionSlug: 100,
  teamName: 80,
  school: 200,
  member1Name: 120,
  member1Email: 254,
  member2Name: 120,
  member2Email: 254,
  member3Name: 120,
  member3Email: 254,
  teamId: 36,
}

export async function POST(request: NextRequest) {
  const auth = await getScopedUser(request, ['admin'])
  if (!auth.ok) return apiError(auth.code, auth.message, auth.status)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_JSON', 'Format request tidak valid.', 400)
  }

  const fields = parseTextFields(body, SEED_FIELDS)
  if (!fields.ok) return apiError('INVALID_INPUT', `Kolom ${fields.field} tidak valid.`, 400)
  const values = fields.values
  const supabase = createServiceClient()

  switch (values.action) {
    case 'seed': {
      if (!values.competitionSlug || !values.teamName || !values.school) {
        return apiError('INVALID_INPUT', 'Lomba, nama tim dan sekolah wajib diisi.', 400)
      }
      const result = await seedLabTeam(supabase, {
        competitionSlug: values.competitionSlug,
        teamName: values.teamName,
        school: values.school,
        members: [
          { name: values.member1Name ?? '', email: values.member1Email ?? null },
          { name: values.member2Name ?? '', email: values.member2Email ?? null },
          { name: values.member3Name ?? '', email: values.member3Email ?? null },
        ],
      })
      return result.ok ? apiSuccess(result.data, 201) : apiError(result.code, result.message, result.status)
    }

    case 'claim': {
      const result = await claimPendingSlots(supabase, auth.user)
      return apiSuccess({ ...result, emailVerified: Boolean(auth.user.email_confirmed_at) })
    }

    case 'release': {
      const result = await releaseLabSlots(supabase, auth.user)
      return result.ok ? apiSuccess(result.data) : apiError(result.code, result.message, result.status)
    }

    case 'restore': {
      if (!values.teamId || !UUID_PATTERN.test(values.teamId)) return apiError('INVALID_INPUT', 'Tim tidak valid.', 400)
      const result = await restoreLabTeam(supabase, values.teamId)
      return result.ok ? apiSuccess(result.data) : apiError(result.code, result.message, result.status)
    }

    case 'delete': {
      if (!values.teamId || !UUID_PATTERN.test(values.teamId)) return apiError('INVALID_INPUT', 'Tim tidak valid.', 400)
      const result = await deleteLabTeams(supabase, [values.teamId])
      return result.ok ? apiSuccess(result.data) : apiError(result.code, result.message, result.status)
    }

    case 'reset': {
      const result = await deleteLabTeams(supabase)
      return result.ok ? apiSuccess(result.data) : apiError(result.code, result.message, result.status)
    }

    default:
      return apiError('UNKNOWN_ACTION', 'Aksi tidak dikenal.', 400)
  }
}
