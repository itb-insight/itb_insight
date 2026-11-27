// Reward tiers & claims API ("Poin Hadiah" sheet, PRD QRS-11).
//  - GET /api/sidequests/rewards: returns reward tiers, remaining stock, and caller eligibility.
//  - POST /api/sidequests/rewards: closed (410) since Insight Arcade went live.

import { type NextRequest } from 'next/server'

import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { getRewardTiersWithStatus } from '@/lib/sidequests'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  const userId = auth.ok ? auth.user.id : null

  try {
    const result = await getRewardTiersWithStatus(userId)
    return apiSuccess(result)
  } catch (err) {
    console.error('[API Sidequests Rewards GET Error]', err)
    return apiError('SERVER_ERROR', 'Gagal memuat daftar hadiah.', 500)
  }
}

// Closed with Insight Arcade (migration 0030): prizes are handed over only at the prize desk
// (staff scan the visitor's QR), never self-claimed. Sticker / Mug / Keychain rules: wave 2-3.
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) return unauthorizedResponse()
  return apiError('GONE', 'Hadiah diambil di meja hadiah (Booth Entre) dengan menunjukkan QR profilmu.', 410)
}
