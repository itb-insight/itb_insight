import { type NextRequest } from 'next/server'

import { getScopedUser } from '@/lib/admin'
import { getAdminAccess } from '@/lib/admin-access'
import { apiError, apiSuccess } from '@/lib/api-response'
import { processGateCheckIn } from '@/lib/check-in'
import { parseTextFields } from '@/lib/input'

// Gate scan (/admin/gate). Body: { qrCode } — the visitor's profile QR.
// Sets profiles.entered_gate (0026, never reset) and checks the visitor ticket in (gate_check_ins).
// Access: admins, and gate staff = role_a 'staff' + role_b 'human_resource' + role_c 'gate_staff'
// (gateAccessFor). The role comes from the profile, never from the body.
export async function POST(request: NextRequest) {
  const auth = await getScopedUser(request, ['gate_staff', 'admin'])
  if (!auth.ok) return apiError(auth.code, auth.message, auth.status)

  const access = await getAdminAccess(auth.user)
  if (!access.gate) return apiError('FORBIDDEN', 'Akses ditolak: akun ini bukan staf gate.', 403)

  const fields = parseTextFields(await request.json().catch(() => null), { qrCode: 300 })
  if (!fields.ok || !fields.values.qrCode) return apiError('INVALID_INPUT', 'Kode QR wajib diisi.', 400)

  try {
    const result = await processGateCheckIn({
      qrCode: fields.values.qrCode,
      staffUserId: auth.user.id,
      gateName: 'main_gate',
      checkInType: 'staff_scan',
    })
    if (!result.ok) return apiError(result.code, result.message, result.code === 'DATABASE_ERROR' ? 500 : 400)

    return apiSuccess({
      visitor: { fullName: result.profile.full_name, institution: result.profile.institution ?? null },
      // false = this visitor had already been scanned in at the gate before.
      firstEntry: result.firstVisitFlag,
      checkedInAt: result.checkInTime,
      ownAccount: result.ticket.user_id === auth.user.id,
    })
  } catch (err) {
    console.error('[API Gate Scan Error]', err instanceof Error ? err.message : 'unknown')
    return apiError('SERVER_ERROR', 'Gagal memproses scan gate.', 500)
  }
}
