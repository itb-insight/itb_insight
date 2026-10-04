import { type NextRequest } from 'next/server'

import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { ensureVisitorTicket } from '@/lib/tickets'
import { processGateCheckIn } from '@/lib/check-in'

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { gateName } = body

    // 1. Ensure user has a valid ticket
    const ticketResult = await ensureVisitorTicket(auth.user.id)
    if (!ticketResult.ok || !ticketResult.ticket) {
      return apiError('TICKET_ERROR', 'Gagal memuat tiket pengunjung Anda.', 500)
    }

    // 2. Perform self check-in
    const result = await processGateCheckIn({
      qrCode: ticketResult.ticket.qr_code,
      staffUserId: auth.user.id,
      gateName: gateName || 'self_service_gate',
      checkInType: 'self_scan',
    })

    if (!result.ok) {
      return apiError(result.code, result.message, 400)
    }

    return apiSuccess({
      checkedIn: true,
      alreadyCheckedIn: result.alreadyCheckedIn,
      checkInTime: result.checkInTime,
      ticket: result.ticket,
    })
  } catch (err) {
    console.error('[API Check-In Self Error]', err)
    return apiError('SERVER_ERROR', 'Terjadi kesalahan saat memproses presensi mandiri.', 500)
  }
}
