// Global gamification leaderboard (PRD QRS-10).
//  - GET /api/sidequests/leaderboard?limit=50
//  - Freezes automatically at 17:00 WIB (see getSidequestWindow in src/lib/sidequests.ts).

import { type NextRequest } from 'next/server'

import { apiError, apiSuccess } from '@/lib/api-response'
import { getLeaderboard } from '@/lib/sidequests'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const rawLimit = new URL(request.url).searchParams.get('limit')
    const parsedLimit = rawLimit ? Number(rawLimit) : 50
    const limit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 200) : 50

    const result = await getLeaderboard({ limit })
    return apiSuccess(result)
  } catch (err) {
    console.error('[API Sidequests Leaderboard Error]', err)
    return apiError('SERVER_ERROR', 'Gagal memuat leaderboard.', 500)
  }
}
