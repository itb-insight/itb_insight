import { type NextRequest } from 'next/server'

import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { recordBoothScan } from '@/lib/booths'

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { qrCode } = body

    if (!qrCode || typeof qrCode !== 'string') {
      return apiError('INVALID_INPUT', 'Parameter qrCode booth wajib diisi.', 400)
    }

    const result = await recordBoothScan(auth.user.id, qrCode)

    if (!result.ok) {
      const status = result.code === 'GATE_CHECKIN_REQUIRED' ? 403 : 400
      return apiError(result.code, result.message, status)
    }

    return apiSuccess({
      booth: result.booth,
      pointsAwarded: result.pointsAwarded,
      alreadyVisited: result.alreadyVisited,
      totalPoints: result.totalPoints,
      totalVisited: result.totalVisited,
    })
  } catch (err) {
    console.error('[API Booth Scan Error]', err)
    return apiError('SERVER_ERROR', 'Terjadi kesalahan saat memproses pemindaian booth.', 500)
  }
}
