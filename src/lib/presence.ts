import 'server-only'

import { unstable_cache } from 'next/cache'

import { getEvents } from '@/features/events/data'
import { getUserRole } from '@/lib/admin'
import { getVenue, type Venue } from '@/lib/geofence'
import type { PresenceBooth, Zone } from '@/lib/presence-geo'
import { D_DAY, jakartaDate } from '@/lib/dashboard-agenda'
import { createServiceClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/types/database'

/*
  Booth presence configuration (server). Zones, all optional, all server-side env:

    VENUE_LAT / VENUE_LNG / VENUE_RADIUS_M   event zone (ITB Ganesha), shared with self check-in.
                                             Unset = presence is off.
    BOOTH_ZONE_LAT / _LNG / _RADIUS_M        the booth area inside it; burst sampling runs only
                                             here. Unset = single fixes everywhere.
    BOOTH_MAX_ACCURACY_M                     fixes less precise than this never match a booth (25)
    PRESENCE_BURST=true                      EXPERIMENTAL burst sampling in the booth zone
    PRESENCE_DATES=2026-11-26,2026-11-28     days (Jakarta) presence runs. Default: D-Day plus the
                                             dated events. Set a test day here for the field test.
    PRESENCE_HOURS=7-22                      hours (Jakarta, start inclusive, end exclusive)
    PRESENCE_TEST_MODE=true                  admin and staff accounts (field/gate/booth) run presence
                                             any day, any hour, and get the opt-in card without a
                                             gate check-in, plus the debug readout. Everything else
                                             stays: consent, the zones, booth + time only. Leave it
                                             off in production once testing is done.

  Location is recorded only inside the event zone, only for signed-in users who opted in, and
  only booth + time are stored (migration 0016). Never awards points: GPS can be faked.
*/

export type PresenceSettings = {
  eventZone: Venue
  boothZone: Zone | null
  boothMaxAccuracyM: number
  burst: boolean
}

function numberEnv(name: string): number | null {
  const raw = process.env[name]
  if (raw === undefined || raw.trim() === '') return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

/** Null when the event zone (VENUE_LAT/LNG) is not configured: the feature is off. */
export function getPresenceSettings(): PresenceSettings | null {
  const eventZone = getVenue()
  if (!eventZone) return null

  const lat = numberEnv('BOOTH_ZONE_LAT')
  const lng = numberEnv('BOOTH_ZONE_LNG')
  const radiusM = numberEnv('BOOTH_ZONE_RADIUS_M')
  const boothZone =
    lat !== null && lng !== null && radiusM !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && radiusM > 0
      ? { lat, lng, radiusM }
      : null

  return {
    eventZone,
    boothZone,
    boothMaxAccuracyM: numberEnv('BOOTH_MAX_ACCURACY_M') ?? 25,
    burst: process.env.PRESENCE_BURST === 'true',
  }
}

const DATE = /^\d{4}-\d{2}-\d{2}$/

/** Jakarta dates presence runs on. */
export async function presenceDays(): Promise<Set<string>> {
  const configured = (process.env.PRESENCE_DATES ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => DATE.test(value))
  if (configured.length > 0) return new Set(configured)

  const events = await getEvents()
  return new Set([D_DAY, ...events.map((event) => event.date).filter((date): date is string => !!date)])
}

function presenceHours(): [number, number] {
  const match = /^(\d{1,2})-(\d{1,2})$/.exec(process.env.PRESENCE_HOURS?.trim() ?? '')
  const start = match ? Number(match[1]) : 7
  const end = match ? Number(match[2]) : 22
  return start >= 0 && end <= 24 && start < end ? [start, end] : [7, 22]
}

const jakartaHour = (now: Date) =>
  Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', hour12: false }).format(now)) % 24

/** True on a presence day, inside presence hours (Jakarta). */
export async function isPresenceOpen(now: Date = new Date()): Promise<boolean> {
  const [start, end] = presenceHours()
  const hour = jakartaHour(now)
  if (hour < start || hour >= end) return false
  return (await presenceDays()).has(jakartaDate(now.toISOString()))
}

const PRESENCE_TESTER_ROLES: readonly UserRole[] = ['admin', 'field_staff', 'gate_staff', 'booth_staff']

/** PRESENCE_TEST_MODE is on and this role may test presence outside the event window. */
export function isPresenceTesterRole(role: UserRole | null): boolean {
  return process.env.PRESENCE_TEST_MODE === 'true' && role !== null && PRESENCE_TESTER_ROLES.includes(role)
}

/** Same check from a user; reads the role only when test mode is on. */
export async function isPresenceTester(user: Parameters<typeof getUserRole>[0]): Promise<boolean> {
  if (process.env.PRESENCE_TEST_MODE !== 'true') return false
  return isPresenceTesterRole(await getUserRole(user))
}

/** Start of today in Jakarta, as an ISO instant. */
export function startOfJakartaDay(now: Date = new Date()): string {
  return new Date(`${jakartaDate(now.toISOString())}T00:00:00+07:00`).toISOString()
}

/** Active booths with real-world coordinates. Cached for a minute: read on every ping. */
export const getPresenceBooths = unstable_cache(
  async (): Promise<PresenceBooth[]> => {
    const { data, error } = await createServiceClient()
      .from('booths')
      .select('id, name, lat, lng, presence_radius_m')
      .eq('is_active', true)
      .not('lat', 'is', null)
      .not('lng', 'is', null)
    if (error) throw new Error(`booths: ${error.message}`)
    return (data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      lat: row.lat as number,
      lng: row.lng as number,
      radiusM: row.presence_radius_m as number,
    }))
  },
  ['presence-booths'],
  { revalidate: 60, tags: ['booths'] },
)

export async function getPresenceConsent(userId: string): Promise<string | null> {
  const { data, error } = await createServiceClient()
    .from('profiles')
    .select('presence_consent_at')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw new Error(`profiles: ${error.message}`)
  return (data?.presence_consent_at as string | null | undefined) ?? null
}

/** A gate check-in today puts the user at Ganesha: the strongest "show the prompt" signal. */
export async function checkedInToday(userId: string, now: Date = new Date()): Promise<boolean> {
  const { count, error } = await createServiceClient()
    .from('gate_check_ins')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('checked_in_at', startOfJakartaDay(now))
  return !error && (count ?? 0) > 0
}

/**
 * Best effort: Vercel's IP geolocation says Bandung. Mobile carrier IPs often geolocate to
 * Jakarta, so this only widens who sees the prompt; it gates nothing valuable.
 */
export function nearBandung(headers: Headers): boolean {
  const raw = headers.get('x-vercel-ip-city')
  if (!raw) return false
  let city = raw
  try {
    city = decodeURIComponent(raw)
  } catch {
    // keep the raw value
  }
  return /bandung|cimahi/i.test(city)
}
