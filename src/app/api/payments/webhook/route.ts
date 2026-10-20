import { NextResponse, type NextRequest } from 'next/server'

import { processMidtransNotification, type MidtransNotificationPayload } from '@/lib/payments/midtrans'

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as MidtransNotificationPayload

    if (!payload?.order_id || !payload?.status_code || !payload?.gross_amount || !payload?.signature_key) {
      return NextResponse.json({ status: 'ERROR', message: 'Payload tidak lengkap' }, { status: 400 })
    }

    const result = await processMidtransNotification(payload)

    if (!result.ok) {
      console.warn('[Midtrans Webhook Rejected]', result.code, payload.order_id)
      return NextResponse.json({ status: 'ERROR', message: result.message }, { status: result.status })
    }

    return NextResponse.json({ status: 'OK', paymentStatus: result.status })
  } catch (err) {
    console.error('[API Midtrans Webhook Error]', err)
    // 500 so Midtrans retries delivery.
    return NextResponse.json({ status: 'ERROR', message: 'Internal Server Error' }, { status: 500 })
  }
}
