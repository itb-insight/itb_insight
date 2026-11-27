import { type NextRequest } from 'next/server'

import { getScopedUser } from '@/lib/admin'
import { apiError, apiSuccess } from '@/lib/api-response'
import { awardBoothPoints, BOOTH_AWARD_ROLES, previewBoothAward, type BoothAwardParams } from '@/lib/booths'

// Booth staff scan a visitor's personal QR to award points (rules: src/lib/booths.ts).
// Body: { qrCode, boothId?, bonusPoints?, points? (admin only), confirmSkippedGate?, confirmWarnings?, dryRun? }
// dryRun: resolve the visitor and report what would happen, without writing anything.
// 409 CONFIRMATION_REQUIRED / GATE_CHECKIN_REQUIRED: show the screen, then resend with the flag.
export async function POST(request: NextRequest) {
  const auth = await getScopedUser(request, [...BOOTH_AWARD_ROLES])
  if (!auth.ok) {
    return apiError(auth.code, auth.message, auth.status)
  }

  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return apiError('INVALID_INPUT', 'Body permintaan tidak valid.', 400)
    }

    const { qrCode, boothId, bonusPoints, points, confirmSkippedGate, confirmWarnings, dryRun } = body as Record<string, unknown>

    const params: BoothAwardParams = {
      staffUserId: auth.user.id,
      staffRole: auth.role,
      visitorQr: qrCode,
      boothId: typeof boothId === 'string' && boothId ? boothId : undefined,
      bonusPoints: bonusPoints === undefined || bonusPoints === null || bonusPoints === '' ? 0 : Number(bonusPoints),
      points: points === undefined || points === null || points === '' ? undefined : Number(points),
      confirmSkippedGate: confirmSkippedGate === true,
      confirmWarnings: confirmWarnings === true,
    }

    const result = dryRun === true ? await previewBoothAward(params) : await awardBoothPoints(params)

    if (!result.ok) {
      if (result.code === 'CONFIRMATION_REQUIRED') {
        return Response.json(
          { success: false, data: result.preview, error: { code: result.code, message: result.message } },
          { status: 409 },
        )
      }
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
        result.code === 'BOOTH_NOT_ASSIGNED' || result.code === 'SELF_AWARD' || result.code === 'COMMITTEE_ACCOUNT'
          ? 403
          : result.code === 'DATABASE_ERROR'
            ? 500
            : result.code === 'TICKET_NOT_FOUND' || result.code === 'BOOTH_NOT_FOUND'
              ? 404
              : 400
      return apiError(result.code, result.message, status)
    }

    return apiSuccess(result)
  } catch (err) {
    console.error('[API Booth Award Error]', err)
    return apiError('SERVER_ERROR', 'Terjadi kesalahan internal saat memberi poin.', 500)
  }
}
