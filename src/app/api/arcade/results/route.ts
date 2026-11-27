import { after, type NextRequest } from 'next/server'

import { adminEmailList, getAdminUser } from '@/lib/admin'
import { apiError, apiSuccess } from '@/lib/api-response'
import { recordAuditLog } from '@/lib/audit'
import { UUID_PATTERN } from '@/lib/input'
import { createServiceClient } from '@/lib/supabase/server'

// Insight Arcade: publish the final results (arcade_publish_results, 0033). Admins only.
// Body: { force?: boolean, disqualify?: uuid[] }.
const MESSAGES: Record<string, [number, string]> = {
  NOT_FROZEN: [409, 'Insight Arcade belum ditutup.'],
  PRIZES_HANDED: [409, 'Mug/Keychain sudah mulai diserahkan: hasil sudah final.'],
  PENDING_REVIEWS: [409, 'Masih ada bukti top 15 yang belum direview.'],
}

export async function POST(request: NextRequest) {
  const auth = await getAdminUser(request)
  if (!auth.ok) return apiError(auth.code, auth.message, auth.status)

  const body = ((await request.json().catch(() => null)) ?? {}) as { force?: unknown; disqualify?: unknown }
  const disqualify = Array.isArray(body.disqualify) ? body.disqualify : []
  if (disqualify.length > 50 || disqualify.some((id) => typeof id !== 'string' || !UUID_PATTERN.test(id))) {
    return apiError('INVALID_INPUT', 'Daftar diskualifikasi tidak valid.', 400)
  }

  const { data, error } = await createServiceClient().rpc('arcade_publish_results', {
    p_by: auth.user.id,
    p_admin_emails: adminEmailList(),
    p_disqualify: disqualify,
    p_force: body.force === true,
  })
  if (error) {
    console.error('[arcade-results] publish failed', error)
    return apiError('SERVER_ERROR', 'Gagal mengumumkan hasil.', 500)
  }
  const result = (data ?? {}) as { ok?: boolean; code?: string; pending?: number; version?: number }
  if (!result.ok) {
    const [status, message] = MESSAGES[result.code ?? ''] ?? [500, 'Gagal mengumumkan hasil.']
    return apiError((result.code ?? 'SERVER_ERROR') as Uppercase<string>, `${message}${result.pending ? ` (${result.pending})` : ''}`, status)
  }
  after(() =>
    recordAuditLog({ userId: auth.user.id, action: 'ARCADE_RESULTS_PUBLISHED', metadata: { version: result.version, disqualify, force: body.force === true } }),
  )
  return apiSuccess({ version: result.version })
}
