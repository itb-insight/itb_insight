import { type NextRequest } from 'next/server'

import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { getUserRole } from '@/lib/admin'
import { getAdminAccess } from '@/lib/admin-access'
import { getAuthenticatedUser } from '@/lib/auth'
import { checkedInToday, getPresenceConsent, getPresenceSettings, isPresenceOpen, isPresenceTesterRole, nearBandung } from '@/lib/presence'

export const dynamic = 'force-dynamic'

// What the browser tracker needs: whether presence runs now, the zones to check locally, and
// whether to offer the opt-in card. Signed-in users only; the venue is public anyway.
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) return unauthorizedResponse()

  const settings = getPresenceSettings()
  if (!settings) return apiSuccess({ enabled: false as const })

  try {
    const [open, consentAt, checkedIn, role] = await Promise.all([
      isPresenceOpen(),
      getPresenceConsent(auth.user.id),
      checkedInToday(auth.user.id),
      getUserRole(auth.user),
    ])
    // PRESENCE_TEST_MODE: admin and staff test any day, any hour, without a gate check-in.
    const tester = isPresenceTesterRole(role)

    // The browser can't tell where the user is before permission is granted, so the opt-in card
    // shows only to people likely at Ganesha: checked in at the gate today, a Bandung IP, or staff
    // (working the event, never checked in at the gate, and mobile IPs often geolocate to Jakarta).
    // The staff lookup runs only when nothing cheaper already decided it.
    const promptEligible =
      tester ||
      checkedIn ||
      nearBandung(request.headers) ||
      (open && consentAt === null && (await getAdminAccess(auth.user)).staff)

    const { eventZone, boothZone, burst } = settings
    return apiSuccess({
      enabled: true as const,
      open: open || tester,
      consented: consentAt !== null,
      promptEligible,
      eventZone: { lat: eventZone.lat, lng: eventZone.lng, radiusM: eventZone.radiusM, maxAccuracyM: eventZone.maxAccuracyM },
      boothZone,
      burst,
      // Admins (and testers) see the field-test readout (zone, booth, burst spread).
      debug: role === 'admin' || tester,
      tester,
    })
  } catch (err) {
    console.error('[API Presence Config Error]', err)
    return apiError('SERVER_ERROR', 'Gagal memuat pengaturan lokasi.', 500)
  }
}
