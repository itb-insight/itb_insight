import { after, type NextRequest } from 'next/server'

import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { recordAuditLog } from '@/lib/audit'
import { getAuthenticatedUser } from '@/lib/auth'
import { clientIpFromHeaders } from '@/lib/client-ip'
import { parseTextFields, UUID_PATTERN } from '@/lib/input'
import { checkRateLimit, rateLimitResponse, sensitiveMutationRateLimit } from '@/lib/rate-limit'
import { createServiceClient } from '@/lib/supabase/server'
import { inviteToSlot, transferLeadership, withdraw, type ActionResult } from '@/lib/team-actions'

/*
  Team actions from the /dashboard activity card (src/lib/team-actions.ts):

    { action: 'invite',   teamId, memberId, email }   leader; email '' clears the invite
    { action: 'leader',   teamId, memberId }          leader hands over to a joined member
    { action: 'withdraw', teamId, confirmation }      member leaves; leader withdraws the team

  Registration ran on the Google Form, so there is no registration switch to check here: these
  only manage teams that already exist. Roles come from the database, never from the body.
*/

const FIELDS = { action: 20, teamId: 36, memberId: 36, email: 254, confirmation: 20 }

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) return unauthorizedResponse()

  const rateLimit = checkRateLimit(request, { scope: 'team-manage', identity: auth.user.id, ...sensitiveMutationRateLimit })
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfterSeconds)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_JSON', 'Format request tidak valid.', 400)
  }

  const fields = parseTextFields(body, FIELDS)
  if (!fields.ok) return apiError('INVALID_INPUT', `Kolom ${fields.field} tidak valid.`, 400)
  const { action, teamId, memberId, email, confirmation } = fields.values

  if (!teamId || !UUID_PATTERN.test(teamId)) return apiError('INVALID_INPUT', 'Tim tidak valid.', 400)
  const needsMember = action === 'invite' || action === 'leader'
  if (needsMember && (!memberId || !UUID_PATTERN.test(memberId))) return apiError('INVALID_INPUT', 'Anggota tidak valid.', 400)

  const supabase = createServiceClient()
  let result: ActionResult<Record<string, unknown>>

  switch (action) {
    case 'invite':
      result = await inviteToSlot(supabase, auth.user, { teamId, memberId: memberId!, email: email ?? null })
      break
    case 'leader':
      result = await transferLeadership(supabase, auth.user, { teamId, memberId: memberId! })
      break
    case 'withdraw':
      result = await withdraw(supabase, auth.user, { teamId, confirmation: confirmation ?? '' })
      break
    default:
      return apiError('UNKNOWN_ACTION', 'Aksi tidak dikenal.', 400)
  }

  if (!result.ok) return apiError(result.code, result.message, result.status)

  const ipAddress = clientIpFromHeaders(request.headers)
  after(() =>
    recordAuditLog({
      userId: auth.user.id,
      action: `team.${action}`,
      targetTable: 'competition_teams',
      recordId: teamId,
      metadata: { memberId: memberId ?? null, ...result.data },
      ipAddress,
    }),
  )

  return apiSuccess(result.data)
}
