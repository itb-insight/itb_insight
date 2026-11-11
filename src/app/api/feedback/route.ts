import { type NextRequest } from 'next/server'

import { apiError, apiSuccess } from '@/lib/api-response'
import { getScopedUser } from '@/lib/admin'
import { getFeedbackSummaries } from '@/lib/feedback/summary'

export const dynamic = 'force-dynamic'

// Staff summary across feedback forms (FBK-05). Optional ?form=<slug>.
// Submissions go to POST /api/feedback/[slug].
export async function GET(request: NextRequest) {
  const auth = await getScopedUser(request, ['field_staff', 'admin'])
  if (!auth.ok) {
    return apiError(auth.code, auth.message, auth.status)
  }

  try {
    const slug = new URL(request.url).searchParams.get('form') || undefined
    return apiSuccess(await getFeedbackSummaries(slug))
  } catch (err) {
    console.error('[API Feedback Summary Error]', err)
    return apiError('SERVER_ERROR', 'Gagal memuat rekap feedback.', 500)
  }
}
