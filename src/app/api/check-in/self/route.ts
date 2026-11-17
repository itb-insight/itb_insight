import { type NextRequest } from 'next/server'

import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { processGateCheckIn } from '@/lib/check-in'
import { checkWithinVenue, getVenue, parseFix } from '@/lib/geofence'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { ensureVisitorTicket } from '@/lib/tickets'

// Self check-in: allowed only from inside the venue geofence (src/lib/geofence.ts).
// Body: { location: { lat, lng, accuracy } } from navigator.geolocation (accuracy in metres).
// Disabled (503) until VENUE_LAT / VENUE_LNG are configured.
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) {
    return unauthorizedResponse()
  }

  const venue = getVenue()
  if (!venue) {
    return apiError('SELF_CHECKIN_DISABLED', 'Presensi mandiri belum dibuka. Silakan scan QR di gate.', 503)
  }

  // Limits probing the geofence edge with made-up coordinates.
  const rate = checkRateLimit(request, { scope: 'self-check-in', identity: auth.user.id, limit: 10, windowMs: 10 * 60_000 })
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds)

  try {
    const body = await request.json().catch(() => ({}))
    const fix = parseFix((body as { location?: unknown })?.location)
    if (!fix) {
      return apiError('LOCATION_REQUIRED', 'Izinkan akses lokasi untuk presensi mandiri.', 400)
    }

    const where = checkWithinVenue(venue, fix)
    if (!where.ok) {
      return where.code === 'LOCATION_TOO_IMPRECISE'
        ? apiError(where.code, 'Lokasi kurang akurat. Aktifkan GPS lalu coba lagi.', 400)
        : apiError('OUTSIDE_VENUE', 'Kamu belum berada di area acara.', 403)
    }

    const ticketResult = await ensureVisitorTicket(auth.user.id)
    if (!ticketResult.ok || !ticketResult.ticket) {
      return apiError('TICKET_ERROR', 'Gagal memuat tiket pengunjung Anda.', 500)
    }

    const result = await processGateCheckIn({
      qrCode: ticketResult.ticket.qr_code,
      staffUserId: auth.user.id,
      gateName: 'self_service_geofence',
      checkInType: 'self_scan',
    })

    if (!result.ok) {
      return apiError(result.code, result.message, 400)
    }

    return apiSuccess({
      checkedIn: true,
      alreadyCheckedIn: result.alreadyCheckedIn,
      checkInTime: result.checkInTime,
    })
  } catch (err) {
    console.error('[API Check-In Self Error]', err)
    return apiError('SERVER_ERROR', 'Terjadi kesalahan saat memproses presensi mandiri.', 500)
  }
}
