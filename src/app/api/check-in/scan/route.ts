import { type NextRequest } from 'next/server'

import { apiError, apiSuccess } from '@/lib/api-response'
import { getScopedUser } from '@/lib/admin'
import { processGateCheckIn } from '@/lib/check-in'

export async function POST(request: NextRequest) {
  const auth = await getScopedUser(request, ['gate_staff', 'admin'])
  if (!auth.ok) {
    return apiError(auth.code, auth.message, auth.status)
  }

  try {
    const body = await request.json()
    const { qrCode, gateName } = body

    if (!qrCode || typeof qrCode !== 'string') {
      return apiError('INVALID_INPUT', 'Parameter qrCode wajib diisi.', 400)
    }

    const result = await processGateCheckIn({
      qrCode,
      staffUserId: auth.user.id,
      gateName: gateName || 'main_gate',
      checkInType: 'staff_scan',
    })

    if (!result.ok) {
      return apiError(result.code, result.message, 400)
    }

    return apiSuccess({
      ticket: result.ticket,
      profile: result.profile,
      alreadyCheckedIn: result.alreadyCheckedIn,
      checkInTime: result.checkInTime,
    })
  } catch (err) {
    console.error('[API Check-In Scan Error]', err)
    return apiError('SERVER_ERROR', 'Terjadi kesalahan internal saat memproses check-in.', 500)
  }
}
