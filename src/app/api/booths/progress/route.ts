import { type NextRequest } from 'next/server'

import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { getUserBoothProgress } from '@/lib/booths'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) {
    return unauthorizedResponse()
  }

  try {
    const progress = await getUserBoothProgress(auth.user.id)
    return apiSuccess(progress)
  } catch (err) {
    console.error('[API Booth Progress Error]', err)
    return apiError('SERVER_ERROR', 'Gagal memuat progres kunjungan booth.', 500)
  }
}
