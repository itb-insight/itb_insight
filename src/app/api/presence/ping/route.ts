import { type NextRequest } from 'next/server'

import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { checkWithinVenue, parseFix, type Fix } from '@/lib/geofence'
import { getPresenceBooths, getPresenceConsent, getPresenceSettings, isPresenceOpen } from '@/lib/presence'
import { BURST_FIXES, combineFixes, nearestBooth, VISIT_MIN_SECONDS } from '@/lib/presence-geo'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { createServiceClient } from '@/lib/supabase/server'

// One presence ping from the browser tracker. Body: { fixes: [{ lat, lng, accuracy }, ...] },
// 1 fix, or up to 8 when burst sampling (EXPERIMENTAL, PRESENCE_BURST=true) is on.
// Coordinates are used for this request only: never stored, never logged. What is stored is
// which booth (or none) and when (record_booth_presence, migration 0016).
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) return unauthorizedResponse()

  const settings = getPresenceSettings()
  if (!settings) return apiError('PRESENCE_DISABLED', 'Pencatatan lokasi belum aktif.', 503)

  // One ping a minute is normal; a few extra come from tabs regaining focus. Many visitors share
  // the venue Wi-Fi's IP, so the per-IP cap is much higher than the per-user one.
  const rate = checkRateLimit(request, {
    scope: 'presence-ping',
    identity: auth.user.id,
    limit: 4,
    windowMs: 60_000,
    ipLimit: 1_000,
  })
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds)

  const body = (await request.json().catch(() => null)) as { fixes?: unknown } | null
  const rawFixes = Array.isArray(body?.fixes) ? body.fixes.slice(0, BURST_FIXES) : []
  const parsed = rawFixes.map(parseFix).filter((fix): fix is Fix => fix !== null)
  if (parsed.length === 0) return apiError('LOCATION_REQUIRED', 'Lokasi tidak terbaca.', 400)
  const fixes = settings.burst ? parsed : parsed.slice(-1)

  try {
    const [open, consentAt] = await Promise.all([isPresenceOpen(), getPresenceConsent(auth.user.id)])
    if (!open) return apiError('PRESENCE_CLOSED', 'Pencatatan lokasi hanya berjalan saat acara.', 403)
    if (!consentAt) return apiError('CONSENT_REQUIRED', 'Kamu belum mengizinkan pencatatan lokasi.', 403)

    // Event zone first, with the venue's looser accuracy cap. Outside it nothing is recorded.
    const venueFix = combineFixes(fixes, settings.eventZone.maxAccuracyM)
    if (!venueFix || !checkWithinVenue(settings.eventZone, venueFix.fix).ok) {
      return apiSuccess({ insideVenue: false, booth: null, dwellSeconds: 0, visitMinSeconds: VISIT_MIN_SECONDS, fixes: null })
    }

    // Booth matching only with precise fixes.
    const boothFix = combineFixes(fixes, settings.boothMaxAccuracyM)
    const booth = boothFix ? nearestBooth(boothFix.fix, await getPresenceBooths()) : null

    const { data, error } = await createServiceClient().rpc('record_booth_presence', {
      p_user: auth.user.id,
      p_booth: booth?.id ?? null,
    })
    if (error) throw new Error(error.message)
    const visit = (Array.isArray(data) ? data[0] : data) as { dwell_seconds?: number } | null

    return apiSuccess({
      insideVenue: true,
      booth: booth ? { id: booth.id, name: booth.name } : null,
      dwellSeconds: visit?.dwell_seconds ?? 0,
      visitMinSeconds: VISIT_MIN_SECONDS,
      // Burst quality for the field test (admin readout). Distances only, no coordinates.
      fixes: {
        received: fixes.length,
        used: (boothFix ?? venueFix).used,
        spreadM: (boothFix ?? venueFix).spreadM,
        accuracyM: Math.round((boothFix ?? venueFix).fix.accuracyM * 10) / 10,
      },
    })
  } catch (err) {
    console.error('[API Presence Ping Error]', err instanceof Error ? err.message : 'unknown')
    return apiError('SERVER_ERROR', 'Gagal mencatat lokasi.', 500)
  }
}
