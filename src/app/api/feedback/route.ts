import { type NextRequest } from 'next/server'

import { apiError, apiSuccess } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { getScopedUser } from '@/lib/admin'
import { submitFeedback, getFeedbackSummary } from '@/lib/feedback'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await getScopedUser(request, ['field_staff', 'admin'])
  if (!auth.ok) {
    return apiError(auth.code, auth.message, auth.status)
  }

  try {
    const { searchParams } = new URL(request.url)
    const context = (searchParams.get('context') as 'event' | 'booth' | 'inspirates') || undefined

    const summary = await getFeedbackSummary(context)
    return apiSuccess(summary)
  } catch (err) {
    console.error('[API Feedback Summary Error]', err)
    return apiError('SERVER_ERROR', 'Gagal memuat rekap feedback.', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { context, rating, category, comment, boothId, metadata } = body

    if (!rating || typeof rating !== 'number') {
      return apiError('INVALID_INPUT', 'Parameter rating wajib berupa angka 1-5.', 400)
    }

    // Attempt to attach authenticated user ID if logged in (optional for feedback)
    let userId: string | null = null
    const auth = await getAuthenticatedUser(request)
    if (auth.ok && auth.user) {
      userId = auth.user.id
    }

    const result = await submitFeedback({
      context: context || 'event',
      rating,
      category,
      comment,
      boothId,
      userId,
      metadata,
    })

    if (!result.ok) {
      return apiError(result.code, result.message, 400)
    }

    return apiSuccess({
      message: 'Terima kasih atas feedback yang Anda berikan!',
      feedbackId: result.feedback.id,
    })
  } catch (err) {
    console.error('[API Feedback POST Error]', err)
    return apiError('SERVER_ERROR', 'Terjadi kesalahan saat menyimpan feedback.', 500)
  }
}
