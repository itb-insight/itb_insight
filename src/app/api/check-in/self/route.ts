import { type NextRequest } from 'next/server'

import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { processCampusGeoAttendance } from '@/lib/check-in'

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { gateName, event, latitude, longitude } = body

    const result = await processCampusGeoAttendance({
      userId: auth.user.id,
      event: event === 'exit' ? 'exit' : event === 'enter' ? 'enter' : undefined,
      latitude: typeof latitude === 'number' ? latitude : null,
      longitude: typeof longitude === 'number' ? longitude : null,
      gateName: gateName || 'self_service_gate',
    })

    if (!result.ok) {
      return apiError(result.code, result.message, 400)
    }

    return apiSuccess({
      event: result.event,
      checkedIn: result.attending,
      isOnCampus: result.isOnCampus,
      alreadyCheckedIn: result.alreadyCheckedIn,
      checkInTime: result.timestamp,
      ticket: result.ticket,
    })
  } catch (err) {
    console.error('[API Check-In Self Error]', err)
    return apiError('SERVER_ERROR', 'Terjadi kesalahan saat memproses presensi kehadiran.', 500)
  }
}
