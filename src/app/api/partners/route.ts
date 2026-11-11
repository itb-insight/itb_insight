import { type NextRequest } from 'next/server'

import { apiError, apiSuccess } from '@/lib/api-response'
import { getPartners } from '@/lib/partners'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const partners = await getPartners()
    return apiSuccess({ partners })
  } catch (err) {
    console.error('[API Partners GET Error]', err)
    return apiError('SERVER_ERROR', 'Gagal memuat daftar mitra dan sponsor.', 500)
  }
}
