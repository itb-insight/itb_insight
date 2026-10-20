import { type NextRequest } from 'next/server'

import { apiError, apiSuccess } from '@/lib/api-response'
import { getScopedUser } from '@/lib/admin'
import { searchVisitorsManual, processGateCheckIn } from '@/lib/check-in'

export async function POST(request: NextRequest) {
  const auth = await getScopedUser(request, ['gate_staff', 'admin'])
  if (!auth.ok) {
    return apiError(auth.code, auth.message, auth.status)
  }

  try {
    const body = await request.json()
    const { action = 'search', query, qrCode, gateName } = body

    if (action === 'search') {
      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        return apiError('INVALID_INPUT', 'Masukkan minimal 2 karakter untuk pencarian nama atau email.', 400)
      }

      const results = await searchVisitorsManual(query)
      return apiSuccess({ results, count: results.length })
    }

    if (action === 'check_in') {
      if (!qrCode || typeof qrCode !== 'string') {
        return apiError('INVALID_INPUT', 'Parameter qrCode wajib disertakan untuk check-in manual.', 400)
      }

      const result = await processGateCheckIn({
        qrCode,
        staffUserId: auth.user.id,
        gateName: gateName || 'manual_desk',
        checkInType: 'manual_lookup',
      })

      if (!result.ok) {
        return apiError(result.code, result.message, 400)
      }

      return apiSuccess(result)
    }

    return apiError('INVALID_ACTION', 'Action tidak dikenal. Gunakan "search" atau "check_in".', 400)
  } catch (err) {
    console.error('[API Check-In Manual Error]', err)
    return apiError('SERVER_ERROR', 'Terjadi kesalahan pada pencarian manual.', 500)
  }
}
