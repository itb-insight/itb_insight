import { after, type NextRequest } from 'next/server'

import { getAdminAccess } from '@/lib/admin-access'
import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { recordAuditLog } from '@/lib/audit'
import { getAuthenticatedUser } from '@/lib/auth'
import { parseTextFields, UUID_PATTERN } from '@/lib/input'
import { createServiceClient } from '@/lib/supabase/server'

// Insight Arcade proof review (migration 0032). Body: { submissionId, decision: 'verify' | 'void' }.
// Access: admins and arcade_duties reviewers. A proof can be decided once (arcade_review_proof).
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) return unauthorizedResponse()
  const access = await getAdminAccess(auth.user)
  if (!access.reviewer) return apiError('FORBIDDEN', 'Akses ditolak: hanya reviewer Insight Arcade.', 403)

  const fields = parseTextFields(await request.json().catch(() => null), { submissionId: 40, decision: 10 })
  const { submissionId, decision } = fields.ok ? fields.values : {}
  if (!submissionId || !UUID_PATTERN.test(submissionId) || (decision !== 'verify' && decision !== 'void')) {
    return apiError('INVALID_INPUT', 'Data tidak valid.', 400)
  }

  const { data, error } = await createServiceClient().rpc('arcade_review_proof', {
    p_submission: submissionId,
    p_decision: decision,
    p_reviewer: auth.user.id,
  })
  if (error) {
    console.error('[arcade-review] failed', error)
    return apiError('SERVER_ERROR', 'Gagal menyimpan keputusan.', 500)
  }
  if (!(data as { ok?: boolean } | null)?.ok) {
    return apiError('NOT_FOUND', 'Bukti ini sudah diputuskan atau tidak ada.', 404)
  }

  after(() =>
    recordAuditLog({
      userId: auth.user.id,
      action: decision === 'verify' ? 'ARCADE_PROOF_VERIFIED' : 'ARCADE_PROOF_VOIDED',
      targetTable: 'sidequest_submissions',
      recordId: submissionId,
    }),
  )
  return apiSuccess({ submissionId, decision })
}
