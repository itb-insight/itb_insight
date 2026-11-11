import { type NextRequest } from 'next/server'

import { apiError, apiSuccess } from '@/lib/api-response'
import { getActiveBooths } from '@/lib/booths'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined

    const booths = await getActiveBooths(category)
    return apiSuccess({ booths, count: booths.length })
  } catch (err) {
    console.error('[API Booths List Error]', err)
    return apiError('SERVER_ERROR', 'Gagal memuat direktori booth.', 500)
  }
}
