// Reward tiers & claims API ("Poin Hadiah" sheet, PRD QRS-11).
//  - GET /api/sidequests/rewards: returns reward tiers, remaining stock, and caller eligibility.
//  - POST /api/sidequests/rewards: claims a reward tier for the caller (or for a scanned visitor QR
//    when called by admin/booth_staff).

import { type NextRequest } from 'next/server'

import { getUserRole } from '@/lib/admin'
import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { parseTextFields, UUID_PATTERN } from '@/lib/input'
import { parseVisitorQr } from '@/lib/qr'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { claimRewardTier, getRewardTiersWithStatus } from '@/lib/sidequests'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  const userId = auth.ok ? auth.user.id : null

  try {
    const result = await getRewardTiersWithStatus(userId)
    return apiSuccess(result)
  } catch (err) {
    console.error('[API Sidequests Rewards GET Error]', err)
    return apiError('SERVER_ERROR', 'Gagal memuat daftar hadiah.', 500)
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) return unauthorizedResponse()

  const rate = checkRateLimit(request, {
    scope: 'reward-claim',
    identity: auth.user.id,
    limit: 15,
    windowMs: 60_000,
  })
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds)

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return apiError('INVALID_JSON', 'Payload JSON tidak valid.', 400)
  }

  const body = typeof rawBody === 'object' && rawBody !== null ? (rawBody as Record<string, unknown>) : {}
  const fields = parseTextFields(body, { tierId: 36, visitorQr: 200 })
  if (!fields.ok) {
    return apiError('INVALID_INPUT', `Field ${fields.field} tidak valid.`, 400)
  }

  const { tierId, visitorQr } = fields.values
  const tierNumber =
    body.tierNumber !== undefined && body.tierNumber !== null ? Number(body.tierNumber) : undefined

  if (!tierId && tierNumber === undefined) {
    return apiError('INVALID_INPUT', 'tierId atau tierNumber wajib diisi.', 400)
  }
  if (tierId && !UUID_PATTERN.test(tierId)) {
    return apiError('INVALID_INPUT', 'tierId harus berformat UUID.', 400)
  }
  if (tierNumber !== undefined && (!Number.isInteger(tierNumber) || tierNumber < 1 || tierNumber > 50)) {
    return apiError('INVALID_INPUT', 'tierNumber tidak valid.', 400)
  }

  try {
    let targetUserId = auth.user.id
    let claimedByStaffId: string | undefined

    if (visitorQr) {
      const role = await getUserRole(auth.user)
      if (!role || !['admin', 'booth_staff', 'field_staff'].includes(role)) {
        return apiError('FORBIDDEN', 'Hanya staf atau admin yang dapat mengklaim hadiah lewat scan QR pengunjung.', 403)
      }
      const token = parseVisitorQr(visitorQr)
      if (!token) {
        return apiError('INVALID_QR', 'QR ini bukan QR profil pengunjung ITB Insight.', 400)
      }
      const { data: ticket } = await createServiceClient()
        .from('visitor_tickets')
        .select('user_id')
        .eq('qr_code', token)
        .maybeSingle()
      if (!ticket?.user_id) {
        return apiError('TICKET_NOT_FOUND', 'Pengunjung tidak ditemukan.', 404)
      }
      targetUserId = ticket.user_id as string
      claimedByStaffId = auth.user.id
    }

    const result = await claimRewardTier({
      userId: targetUserId,
      tierId,
      tierNumber,
      claimedByStaffId,
    })

    if (!result.ok) {
      const status =
        result.code === 'TIER_NOT_FOUND'
          ? 404
          : result.code === 'COMMITTEE_ACCOUNT'
            ? 403
            : result.code === 'ALREADY_CLAIMED' || result.code === 'OUT_OF_STOCK'
              ? 409
              : result.code === 'INSUFFICIENT_POINTS'
                ? 422
                : 500
      return apiError(result.code, result.message, status)
    }

    return apiSuccess({
      message: `Hadiah "${result.tier.reward_name}" berhasil diklaim!`,
      claim: result.claim,
      tier: result.tier,
      totalPoints: result.totalPoints,
    })
  } catch (err) {
    console.error('[API Sidequests Rewards POST Error]', err)
    return apiError('SERVER_ERROR', 'Gagal mengklaim hadiah.', 500)
  }
}
