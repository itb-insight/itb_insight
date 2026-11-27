// Sidequests API:
//  - GET /api/sidequests: returns the active sidequest catalog (seeded from Gamification.xlsx),
//    the 05:00-17:00 WIB window state, and if authenticated, the caller's submission statuses.
//  - POST /api/sidequests: closed (410) since Insight Arcade went live.

import { type NextRequest } from 'next/server'

import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { getSidequestsForUser } from '@/lib/sidequests'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  const userId = auth.ok ? auth.user.id : null

  try {
    const result = await getSidequestsForUser(userId)
    return apiSuccess(result)
  } catch (err) {
    console.error('[API Sidequests GET Error]', err)
    return apiError('SERVER_ERROR', 'Gagal memuat daftar sidequest.', 500)
  }
}

// Closed with Insight Arcade (migration 0030): the old URL-proof submission let visitors create
// rows for automatic quests and is replaced by the Arcade proof upload (wave 2).
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) return unauthorizedResponse()
  return apiError('GONE', 'Pengiriman sidequest lewat jalur ini sudah ditutup. Pakai Insight Arcade.', 410)
}
