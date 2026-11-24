// Sidequests API:
//  - GET /api/sidequests: returns the active sidequest catalog (seeded from Gamification.xlsx),
//    the 05:00-17:00 WIB window state, and if authenticated, the caller's submission statuses.
//  - POST /api/sidequests: authenticated visitor submits a sidequest for D-Day admin verification.

import { type NextRequest } from 'next/server'

import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { parseTextFields, UUID_PATTERN } from '@/lib/input'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { getSidequestsForUser, submitSidequest } from '@/lib/sidequests'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  const userId = auth.ok ? auth.user.id : null

  try {
    const result = await getSidequestsForUser(userId)
    return apiSuccess(result)
  } catch (err) {
    console.error('[API Sidequests GET Error]', err)
    return apiError('SERVER_ERROR', 'Gagal memuat daftar sidequest.', 500)
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) return unauthorizedResponse()

  const rate = checkRateLimit(request, {
    scope: 'sidequest-submit',
    identity: auth.user.id,
    limit: 20,
    windowMs: 60_000,
  })
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds)

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return apiError('INVALID_JSON', 'Payload JSON tidak valid.', 400)
  }

  const fields = parseTextFields(rawBody, {
    questId: 36,
    questSlug: 80,
    proofUrl: 1000,
    note: 500,
  })
  if (!fields.ok) {
    return apiError('INVALID_INPUT', `Field ${fields.field} tidak valid atau terlalu panjang.`, 400)
  }

  const { questId, questSlug, proofUrl, note } = fields.values
  if (!questId && !questSlug) {
    return apiError('INVALID_INPUT', 'questId atau questSlug wajib diisi.', 400)
  }
  if (questId && !UUID_PATTERN.test(questId)) {
    return apiError('INVALID_INPUT', 'questId harus berformat UUID.', 400)
  }
  if (questSlug && !/^[a-z0-9-]{1,80}$/.test(questSlug)) {
    return apiError('INVALID_INPUT', 'questSlug tidak valid.', 400)
  }

  try {
    const result = await submitSidequest({
      userId: auth.user.id,
      questId,
      questSlug,
      proofUrl,
      note,
    })

    if (!result.ok) {
      const status =
        result.code === 'QUEST_NOT_FOUND'
          ? 404
          : result.code === 'COMMITTEE_ACCOUNT' || result.code === 'WINDOW_NOT_OPEN' || result.code === 'WINDOW_CLOSED'
            ? 403
            : result.code === 'ALREADY_APPROVED' || result.code === 'ALREADY_PENDING'
              ? 409
              : result.code === 'DATABASE_ERROR'
                ? 500
                : 400
      return apiError(result.code, result.message, status)
    }

    return apiSuccess(
      {
        message: 'Sidequest berhasil dikirim dan menunggu verifikasi admin.',
        submission: result.submission,
        quest: result.quest,
      },
      201,
    )
  } catch (err) {
    console.error('[API Sidequests POST Error]', err)
    return apiError('SERVER_ERROR', 'Gagal mengirim bukti sidequest.', 500)
  }
}
