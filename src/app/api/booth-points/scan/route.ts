import { after, type NextRequest } from 'next/server'

import { getAdminAccess } from '@/lib/admin-access'
import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { recordAuditLog } from '@/lib/audit'
import { getAuthenticatedUser } from '@/lib/auth'
import { BOOTH_POINT_OPTIONS, type BoothPointOption } from '@/lib/booth-points'
import { runPracticeScan } from '@/lib/booth-practice'
import { parseTextFields } from '@/lib/input'

// Booth staff scan a visitor's profile QR (rules: src/lib/booth-points.ts).
// Body: { qrCode, boothId, option?: 'contribution' | 'bonus', given?: { contribution, bonus } }
//   no option -> who the QR belongs to; option -> confirm the award.
// PRACTICE: adds no points. An award is recorded in audit_logs (BOOTH_POINTS_PRACTICE) only, so
// staff can check the scan reached the server.
// Access: admins, and role_b 'booth' staff / stakeholders for the booths their role allows. The
// role comes from profiles (getAdminAccess), not from the body.
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
  const fields = parseTextFields(body, { qrCode: 300, boothId: 80, option: 20 })
  if (!fields.ok || !fields.values.qrCode || !fields.values.boothId) {
    return apiError('INVALID_INPUT', 'QR dan booth wajib diisi.', 400)
  }

  const { qrCode, boothId, option } = fields.values
  if (option && !BOOTH_POINT_OPTIONS.includes(option as BoothPointOption)) {
    return apiError('INVALID_INPUT', 'Pilihan poin tidak dikenal.', 400)
  }

  const rawGiven = (body as { given?: unknown } | null)?.given as Record<string, unknown> | undefined
  const given = { contribution: rawGiven?.contribution === true, bonus: rawGiven?.bonus === true }

  const result = await runPracticeScan({
    staffUserId: auth.user.id,
    access: access.booth,
    qrCode,
    boothId,
    option: option as BoothPointOption | undefined,
    given,
  })

  if (!result.ok) {
    return apiError(result.code, result.message, result.status)
  }

  if ('plan' in result) {
    after(() =>
      recordAuditLog({
        userId: auth.user.id,
        action: 'BOOTH_POINTS_PRACTICE',
        targetTable: 'booth_scan_events',
        metadata: {
          reference: result.reference,
          boothId: result.booth.id,
          boothName: result.booth.name,
          visitorId: result.visitor.key,
          option: result.plan.option,
          contribution: result.plan.contribution,
          bonus: result.plan.bonus,
          notes: result.notes,
        },
      }),
    )
  }

  const { ok: _ok, ...data } = result
  return apiSuccess(data)
}
