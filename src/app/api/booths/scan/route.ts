import { type NextRequest } from 'next/server'

import { getScopedUser } from '@/lib/admin'
import { apiError, apiSuccess } from '@/lib/api-response'
import { awardBoothPoints } from '@/lib/booths'

// Booth staff scan a visitor's personal QR to award points.
// Body: { qrCode, boothId?, bonusPoints?, confirmSkippedGate? }
export async function POST(request: NextRequest) {
  const auth = await getScopedUser(request, ['booth_staff', 'exhibitor', 'admin'])
  if (!auth.ok) {
    return apiError(auth.code, auth.message, auth.status)
  }

  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return apiError('INVALID_INPUT', 'Body permintaan tidak valid.', 400)
    }

    const { qrCode, boothId, bonusPoints, confirmSkippedGate } = body as Record<string, unknown>

    const result = await awardBoothPoints({
      staffUserId: auth.user.id,
      staffRole: auth.role,
      visitorQr: qrCode,
      boothId: typeof boothId === 'string' && boothId ? boothId : undefined,
      bonusPoints: bonusPoints === undefined || bonusPoints === null ? 0 : Number(bonusPoints),
      confirmSkippedGate: confirmSkippedGate === true,
    })

    if (!result.ok) {
      if (result.code === 'GATE_CHECKIN_REQUIRED') {
        // 409 with the visitor's name so the scanner can show the "Belum absen di gate" prompt.
        return Response.json(
          {
            success: false,
            data: { booth: result.booth, visitor: result.visitor, pointsToAward: result.pointsToAward },
            error: { code: result.code, message: result.message },
          },
          { status: 409 },
        )
      }

      const status =
        result.code === 'BOOTH_NOT_ASSIGNED' || result.code === 'SELF_AWARD'
          ? 403
          : result.code === 'DATABASE_ERROR'
            ? 500
            : result.code === 'TICKET_NOT_FOUND' || result.code === 'BOOTH_NOT_FOUND'
              ? 404
              : 400
      return apiError(result.code, result.message, status)
    }

    return apiSuccess({
      booth: result.booth,
      visitor: result.visitor,
      pointsAwarded: result.pointsAwarded,
      bonusPoints: result.bonusPoints,
      alreadyVisited: result.alreadyVisited,
      skippedGate: result.skippedGate,
      totalPoints: result.totalPoints,
      totalVisited: result.totalVisited,
    })
  } catch (err) {
    console.error('[API Booth Award Error]', err)
    return apiError('SERVER_ERROR', 'Terjadi kesalahan internal saat memberi poin.', 500)
  }
}
