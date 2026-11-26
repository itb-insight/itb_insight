// Booth presence geometry, shared by the browser tracker and /api/presence/ping. Pure: no env,
// no I/O. Configuration lives in src/lib/presence.ts (server).

import { distanceM, type Fix } from './geofence'

export type Zone = { lat: number; lng: number; radiusM: number }

export type PresenceBooth = { id: string; name: string; lat: number; lng: number; radiusM: number }

/** Seconds at one booth before it counts as visited. */
export const VISIT_MIN_SECONDS = 5 * 60

/** Pings inside the event zone. The server ends a visit after 3 minutes without one. */
export const PING_INTERVAL_MS = 60_000
/** Local-only position checks outside the event zone (nothing is sent). */
export const OUTSIDE_CHECK_MS = 3 * 60_000

/** EXPERIMENTAL burst sampling in the booth zone: a fix every 2 s for 16 s. */
export const BURST_FIXES = 8
export const BURST_GAP_MS = 2_000

/** Inside when the fix's uncertainty circle overlaps the zone (same rule as the venue check). */
export function inZone(zone: Zone, fix: Fix): boolean {
  return distanceM(zone, fix) - fix.accuracyM <= zone.radiusM
}

export type CombinedFix = {
  fix: Fix
  /** Fixes used after dropping imprecise ones and outliers. */
  used: number
  /** Root-mean-square distance of the used fixes from the result, in metres (burst quality). */
  spreadM: number
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * Combines a burst of fixes into one (EXPERIMENTAL, tune in the field test):
 *   1. drop fixes less precise than maxAccuracyM
 *   2. drop outliers more than 2σ from the median position
 *   3. accuracy-weighted mean (weight 1/accuracy²)
 * Averaging cancels random jitter, not multipath bias. Returns null when no fix survives.
 */
export function combineFixes(fixes: Fix[], maxAccuracyM: number): CombinedFix | null {
  const precise = fixes.filter((fix) => fix.accuracyM <= maxAccuracyM)
  if (precise.length === 0) return null
  if (precise.length === 1) return { fix: precise[0], used: 1, spreadM: 0 }

  const centre = { lat: median(precise.map((f) => f.lat)), lng: median(precise.map((f) => f.lng)) }
  const distances = precise.map((fix) => distanceM(centre, fix))
  const sigma = Math.sqrt(distances.reduce((sum, d) => sum + d * d, 0) / distances.length)
  const kept = sigma === 0 ? precise : precise.filter((_, i) => distances[i] <= 2 * sigma)

  let weightSum = 0
  let lat = 0
  let lng = 0
  for (const fix of kept) {
    const weight = 1 / Math.max(fix.accuracyM, 1) ** 2
    weightSum += weight
    lat += fix.lat * weight
    lng += fix.lng * weight
  }
  const result = { lat: lat / weightSum, lng: lng / weightSum }
  const spreadM = Math.sqrt(kept.reduce((sum, fix) => sum + distanceM(result, fix) ** 2, 0) / kept.length)

  return {
    fix: { ...result, accuracyM: Math.sqrt(1 / weightSum) },
    used: kept.length,
    spreadM: Math.round(spreadM * 10) / 10,
  }
}

/**
 * The booth whose centre is nearest to the fix, if the fix lies within that booth's radius.
 * The fix's own accuracy is not added here (it was already capped): with ~20 m accuracy circles
 * every neighbouring booth would match.
 */
export function nearestBooth(fix: Fix, booths: PresenceBooth[]): PresenceBooth | null {
  let best: PresenceBooth | null = null
  let bestDistance = Infinity
  for (const booth of booths) {
    const distance = distanceM(booth, fix)
    if (distance <= booth.radiusM && distance < bestDistance) {
      best = booth
      bestDistance = distance
    }
  }
  return best
}
