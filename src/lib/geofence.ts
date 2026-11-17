// Venue geofence for self check-in (docs/MAPS-NOTES.md: "QR works only if user within coordinate
// of venue"). Configured on the server:
//
//   VENUE_LAT, VENUE_LNG   venue centre in decimal degrees. Unset = self check-in is disabled.
//   VENUE_RADIUS_M         allowed distance from the centre, default 300 m
//   VENUE_MAX_ACCURACY_M   reject fixes less precise than this, default 100 m
//
// Client-reported GPS can be faked by a determined user (devtools, mock-location apps). This
// stops casual check-ins from home, not fraud; staff scans remain the authoritative check-in.

export type Venue = { lat: number; lng: number; radiusM: number; maxAccuracyM: number }

export type Fix = { lat: number; lng: number; accuracyM: number }

export type GeofenceResult =
  | { ok: true; distanceM: number }
  | { ok: false; code: 'INVALID_LOCATION' | 'LOCATION_TOO_IMPRECISE' | 'OUTSIDE_VENUE'; distanceM?: number }

const EARTH_RADIUS_M = 6_371_000

function numberEnv(name: string): number | null {
  const raw = process.env[name]
  if (raw === undefined || raw.trim() === '') return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

/** The configured venue, or null when self check-in is not set up yet. */
export function getVenue(): Venue | null {
  const lat = numberEnv('VENUE_LAT')
  const lng = numberEnv('VENUE_LNG')
  if (lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return {
    lat,
    lng,
    radiusM: numberEnv('VENUE_RADIUS_M') ?? 300,
    maxAccuracyM: numberEnv('VENUE_MAX_ACCURACY_M') ?? 100,
  }
}

/** Great-circle distance in metres (haversine). */
export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Parses an untrusted `{ lat, lng, accuracy }` body field. */
export function parseFix(raw: unknown): Fix | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { lat, lng, accuracy } = raw as Record<string, unknown>
  if (typeof lat !== 'number' || typeof lng !== 'number' || typeof accuracy !== 'number') return null
  if (![lat, lng, accuracy].every(Number.isFinite)) return null
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180 || accuracy < 0) return null
  return { lat, lng, accuracyM: accuracy }
}

/**
 * Inside when the fix's uncertainty circle overlaps the venue circle: a phone on the venue edge
 * with a 40 m accuracy still counts, but an imprecise fix (above maxAccuracyM) never does.
 */
export function checkWithinVenue(venue: Venue, fix: Fix): GeofenceResult {
  if (fix.accuracyM > venue.maxAccuracyM) return { ok: false, code: 'LOCATION_TOO_IMPRECISE' }
  const distance = distanceM(venue, fix)
  if (distance - fix.accuracyM > venue.radiusM) return { ok: false, code: 'OUTSIDE_VENUE', distanceM: Math.round(distance) }
  return { ok: true, distanceM: Math.round(distance) }
}
