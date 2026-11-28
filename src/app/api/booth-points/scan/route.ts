import { after, type NextRequest } from 'next/server'

import { getAdminAccess } from '@/lib/admin-access'
import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { recordAuditLog } from '@/lib/audit'
import { getAuthenticatedUser } from '@/lib/auth'
import { runBoothScan } from '@/lib/booth-award'
import { BOOTH_POINT_OPTIONS, type BoothPointOption } from '@/lib/booth-points'
import { parseCapturedAt, parseTextFields } from '@/lib/input'

// Booth staff scan a visitor's profile QR and award Insight Arcade points (rules:
// src/lib/booth-points.ts, enforced by public.arcade_award_booth, migration 0030).
// Body: { qrCode, boothId, option?: 'contribution' | 'bonus', clientRef?: uuid, capturedAt?: ISO }
//   no option  -> who the QR belongs to and what they already have at this booth;
//   option     -> award it. clientRef makes a retried award count once.
//   capturedAt -> the award comes from the scanner's offline queue (src/features/offline-queue):
//                 it counts at that time if inside the game window (the database decides).
// Access: admins, and staff / stakeholders for the booths their role or assignments allow. The
// role comes from profiles (getAdminAccess), never from the body.
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) {
    return unauthorizedResponse()
  }

  const access = await getAdminAccess(auth.user)
  if (!access.booth) {
    return apiError('FORBIDDEN', 'Akses ditolak: akun ini tidak punya akses booth.', 403)
  }

  const body: unknown = await request.json().catch(() => null)
  const fields = parseTextFields(body, { qrCode: 300, boothId: 80, option: 20, clientRef: 36, capturedAt: 40 })
  if (!fields.ok || !fields.values.qrCode || !fields.values.boothId) {
    return apiError('INVALID_INPUT', 'QR dan booth wajib diisi.', 400)
  }

  const { qrCode, boothId, option, clientRef } = fields.values
  if (option && !BOOTH_POINT_OPTIONS.includes(option as BoothPointOption)) {
    return apiError('INVALID_INPUT', 'Pilihan poin tidak dikenal.', 400)
  }
  const capturedAt = parseCapturedAt(fields.values.capturedAt)
  if (!capturedAt.ok) {
    return apiError('INVALID_INPUT', 'Waktu scan tidak valid.', 400)
  }

  const result = await runBoothScan({
    staffUserId: auth.user.id,
    access: access.booth,
    qrCode,
    boothId,
    option: option as BoothPointOption | undefined,
    clientRef,
    capturedAt: capturedAt.value,
  })

  if (!result.ok) {
    return Response.json(
      {
        success: false,
        data: result.given ? { given: result.given } : null,
        error: { code: result.code, message: result.message },
      },
      { status: result.status },
    )
  }

  if ('plan' in result && !result.duplicate) {
    after(() =>
      recordAuditLog({
        userId: auth.user.id,
        action: 'BOOTH_POINTS_AWARDED',
        targetTable: 'booth_scan_events',
        metadata: {
          reference: result.reference,
          boothId: result.booth.id,
          boothName: result.booth.name,
          visitorId: result.visitor.key,
          option: result.plan.option,
          contribution: result.plan.contribution,
          bonus: result.plan.bonus,
          ...(capturedAt.value ? { capturedAt: capturedAt.value } : {}),
        },
      }),
    )
  }

  const { ok: _ok, ...data } = result
  return apiSuccess(data)
}
