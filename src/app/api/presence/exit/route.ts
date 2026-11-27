import { type NextRequest } from 'next/server'

import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { getPresenceConsent, getPresenceSettings, isPresenceOpen, isPresenceTester } from '@/lib/presence'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { markLeftArea } from '@/lib/visit-flags'

// "My phone is outside the event zone now", from the opt-in presence tracker. No body, no
// coordinates: the tracker decides locally (a fix confidently outside the zone) and sends only
// this signal, once when a page first finds the phone outside and again each time it walks out.
// Stores the time in profiles.left_area_at (0028); the /admin/d-day headcount then stops counting
// the visitor until their next in-area signal.
// A faked exit only removes the caller from the headcount, so the user's own word is enough.
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) return unauthorizedResponse()

  if (!getPresenceSettings()) return apiError('PRESENCE_DISABLED', 'Pencatatan lokasi belum aktif.', 503)

  const rate = checkRateLimit(request, {
    scope: 'presence-exit',
    identity: auth.user.id,
    limit: 4,
    windowMs: 60_000,
    ipLimit: 1_000,
  })
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds)

  try {
    const [open, consentAt] = await Promise.all([isPresenceOpen(), getPresenceConsent(auth.user.id)])
    if (!open && !(await isPresenceTester(auth.user))) return apiError('PRESENCE_CLOSED', 'Pencatatan lokasi hanya berjalan saat acara.', 403)
    if (!consentAt) return apiError('CONSENT_REQUIRED', 'Kamu belum mengizinkan pencatatan lokasi.', 403)

    await markLeftArea(auth.user.id)
    return apiSuccess({ recorded: true })
  } catch (err) {
    console.error('[API Presence Exit Error]', err instanceof Error ? err.message : 'unknown')
    return apiError('SERVER_ERROR', 'Gagal mencatat keluar area.', 500)
  }
}
