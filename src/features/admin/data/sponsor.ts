import "server-only"

import { hogql, isPostHogQueryConfigured, num } from "@/lib/analytics/posthog-query"
import { createServiceClient } from "@/lib/supabase/server"
import {
  MEDIA_PARTNERS,
  MEDIA_PARTNERS_SECTION_ID,
  sponsorId,
} from "@/features/landing/components/MediaPartnersSectionHifi/partners"

import { mockSponsorWeb } from "./mockData"
import { bounds, dayKeys, inRange, jakartaDay, lastDays, sampleWeight, selectAll, TIME_ZONE } from "./query"
import type { BoothDayDto, BoothInsightsDto, DateRange, SponsorOptionDto, SponsorWebDto } from "./types"

/** The sponsor page's web figures cover this many days. */
export const SPONSOR_DAYS = 14

/** Event hours drawn on the booth chart, Jakarta time; scans outside them widen it. */
const OPEN_HOUR = 8
const CLOSE_HOUR = 19

export function sponsorOptions(): SponsorOptionDto[] {
  return MEDIA_PARTNERS.map((partner) => ({ id: sponsorId(partner), name: partner.alt }))
}

/** Booths for the picker: active first, then by name. null when the query fails. */
export async function getBoothOptions(): Promise<Array<{ id: string; name: string; category: string }> | null> {
  try {
    const { data, error } = await createServiceClient()
      .from("booths")
      .select("id, name, category, is_active")
      .order("name")
    if (error || !Array.isArray(data)) return null
    return (data as Array<{ id: string; name: string; category: string; is_active: boolean }>)
      .sort((a, b) => Number(b.is_active) - Number(a.is_active))
      .map(({ id, name, category }) => ({ id, name, category }))
  } catch {
    return null
  }
}

/**
 * Brand reach from PostHog. The media-partner marquee logs one impression for the whole section
 * (logos scroll past), so every partner shares the impression count; clicks are this partner's.
 * id is one of sponsorOptions(): it is checked against that list before it reaches a query.
 */
export async function getSponsorWeb(id: string, now: Date = new Date()): Promise<SponsorWebDto | null> {
  if (!/^[a-z0-9-]+$/.test(id) || !sponsorOptions().some((option) => option.id === id)) return null
  if (!isPostHogQueryConfigured()) return mockSponsorWeb(dayKeys(new Date(lastDays(SPONSOR_DAYS, now).to), SPONSOR_DAYS))

  const range: DateRange = lastDays(SPONSOR_DAYS, now)
  const [daily, site] = await Promise.all([
    hogql(
      `sponsor-daily-${id}`,
      `select toString(toDate(toTimeZone(timestamp, '${TIME_ZONE}'))) as day,
              sumIf(${sampleWeight()}, event = 'sponsor_impression' and properties.sectionId = '${MEDIA_PARTNERS_SECTION_ID}'),
              sumIf(${sampleWeight()}, event = 'sponsor_click' and properties.sponsorId = '${id}')
       from events
       where ${inRange(range)} and event in ('sponsor_impression', 'sponsor_click')
       group by day`,
    ),
    hogql("sponsor-site", `select count() from events where event = '$pageview' and ${inRange(range)}`),
  ])
  if (!daily || !site) return null

  const byDay = new Map(daily.results.map(([day, impressions, clicks]) => [String(day), { impressions: num(impressions), clicks: num(clicks) }]))
  const { to, days } = bounds(range)
  const series = dayKeys(to, days).map((day) => ({ day, ...(byDay.get(day) ?? { impressions: 0, clicks: 0 }) }))
  return {
    impressions: series.reduce((sum, row) => sum + row.impressions, 0),
    clicks: series.reduce((sum, row) => sum + row.clicks, 0),
    site_pageviews: num(site.results[0]?.[0]),
    daily: series,
  }
}

type Scan = { user_id: string; captured_at: string; points_awarded: number | null; bonus_points: number | null }

const HOUR = new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hour: "2-digit", hourCycle: "h23" })

/** Scans grouped per Jakarta day, distinct visitors per hour. Pure, for tests. */
export function boothDays(scans: Scan[]): BoothDayDto[] {
  const days = new Map<string, { hours: Map<number, Set<string>>; visitors: Set<string>; points: number }>()
  for (const scan of scans) {
    const at = new Date(scan.captured_at)
    if (Number.isNaN(at.getTime())) continue
    const key = jakartaDay(at)
    const hour = Number(HOUR.format(at))
    const day = days.get(key) ?? { hours: new Map(), visitors: new Set(), points: 0 }
    days.set(key, day)
    const inHour = day.hours.get(hour) ?? new Set<string>()
    day.hours.set(hour, inHour)
    inHour.add(scan.user_id)
    day.visitors.add(scan.user_id)
    day.points += (scan.points_awarded ?? 0) + (scan.bonus_points ?? 0)
  }

  return [...days.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, { hours, visitors, points }]) => {
      const first = Math.min(OPEN_HOUR, ...hours.keys())
      const last = Math.max(CLOSE_HOUR, ...hours.keys())
      return {
        day,
        hours: Array.from({ length: last - first + 1 }, (_, i) => ({ hour: first + i, visitors: hours.get(first + i)?.size ?? 0 })),
        visitors: visitors.size,
        points,
      }
    })
}

/** One booth's visitors from its QR scans, against everyone checked in. null when a query fails. */
export async function getBoothInsights(boothId: string): Promise<BoothInsightsDto | null> {
  try {
    const supabase = createServiceClient()
    const [booth, rows, checkedIn] = await Promise.all([
      supabase.from("booths").select("id, name").eq("id", boothId).maybeSingle(),
      selectAll<Scan>((client) =>
        client
          .from("booth_scan_events")
          .select("user_id, captured_at, points_awarded, bonus_points")
          .eq("booth_id", boothId)
          .order("captured_at")
          .order("id"),
      ),
      supabase.from("visitor_tickets").select("*", { count: "exact", head: true }).eq("checked_in", true),
    ])
    if (booth.error || checkedIn.error || !booth.data) return null

    const boothRow = booth.data as { id: string; name: string }
    return {
      booth_id: boothRow.id,
      name: boothRow.name,
      visitors: new Set(rows.map((row) => row.user_id)).size,
      points: rows.reduce((sum, row) => sum + (row.points_awarded ?? 0) + (row.bonus_points ?? 0), 0),
      checked_in: checkedIn.count ?? 0,
      days: boothDays(rows),
    }
  } catch (err) {
    console.error("[admin sponsor] booth query failed:", err instanceof Error ? err.message : err)
    return null
  }
}
