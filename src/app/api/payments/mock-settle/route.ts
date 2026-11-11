import { type NextRequest } from 'next/server'

import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { mockSettlePayment } from '@/lib/payments/midtrans'

// DEV ONLY: simulates a settled payment when no Midtrans key is configured.
// Returns 404 in production or whenever a real MIDTRANS_SERVER_KEY exists.
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) {
    return unauthorizedResponse()
  }

  const body = await request.json().catch(() => ({}))
  if (!body?.orderId || typeof body.orderId !== 'string') {
    return apiError('INVALID_INPUT', 'Parameter orderId wajib disertakan.', 400)
  }

  const result = await mockSettlePayment(body.orderId, auth.user.id)
  if (!result.ok) {
    return apiError(result.code, result.message, result.status)
  }

  return apiSuccess({ settled: true })
}
