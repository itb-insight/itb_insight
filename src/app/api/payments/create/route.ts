import { type NextRequest } from 'next/server'

import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { createPaymentSession } from '@/lib/payments/midtrans'

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { registrationId } = body

    if (!registrationId || typeof registrationId !== 'string') {
      return apiError('INVALID_INPUT', 'Parameter registrationId wajib disertakan.', 400)
    }

    const result = await createPaymentSession({
      registrationId,
      userId: auth.user.id,
      userEmail: auth.user.email || '',
      userName: auth.user.user_metadata?.full_name || auth.user.email || 'Peserta',
    })

    if (!result.ok) {
      return apiError(result.code, result.message, result.status)
    }

    return apiSuccess({
      paymentId: result.payment.id,
      amount: result.payment.amount,
      currency: result.payment.currency,
      status: result.payment.status,
      orderId: result.transaction.orderId,
      redirectUrl: result.transaction.redirectUrl,
      isMock: result.isMock,
      reused: result.reused,
    })
  } catch (err) {
    console.error('[API Payments Create Error]', err)
    return apiError('SERVER_ERROR', 'Terjadi kesalahan saat membuat sesi pembayaran.', 500)
  }
}
