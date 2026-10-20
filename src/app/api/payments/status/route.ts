import { type NextRequest } from 'next/server'

import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { getPaymentStatus } from '@/lib/payments/midtrans'

export const dynamic = 'force-dynamic'

// ?registrationId=...&sync=1  (sync=1 asks Midtrans for the latest status — covers late webhooks)
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) {
    return unauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const registrationId = searchParams.get('registrationId')

    if (!registrationId) {
      return apiError('INVALID_INPUT', 'Parameter registrationId wajib disertakan.', 400)
    }

    const result = await getPaymentStatus(registrationId, auth.user.id, {
      sync: searchParams.get('sync') === '1',
    })

    // Same answer for "missing" and "not yours": never confirm other users' registrations exist.
    if (!result.found) {
      return apiError('REGISTRATION_NOT_FOUND', 'Registrasi tidak ditemukan.', 404)
    }

    return apiSuccess({ payment: result.payment, canPay: result.canPay })
  } catch (err) {
    console.error('[API Payments Status Error]', err)
    return apiError('SERVER_ERROR', 'Gagal memuat status pembayaran.', 500)
  }
}
