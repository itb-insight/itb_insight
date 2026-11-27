import "server-only"

import { unstable_cache } from "next/cache"

import { DIVISION_ORDER, type DivisionTag } from "@/lib/analytics/divisions"
import { SAMPLE_RATES } from "@/lib/analytics/config"
import {
  envFilter,
  hogql,
  isPostHogQueryConfigured,
  LIVE_TTL,
  num,
  sqlTime,
} from "@/lib/analytics/posthog-query"
import { startOfJakartaDay } from "@/lib/presence"
import { VISIT_MIN_SECONDS } from "@/lib/presence-geo"
import { createServiceClient } from "@/lib/supabase/server"
import {
  MEDIA_PARTNERS,
  MEDIA_PARTNERS_SECTION_ID,
  sponsorId,
} from "@/features/landing/components/MediaPartnersSectionHifi/partners"
import {
  MOCK_COMPETITIONS,
  MOCK_DIVISION_ACTIVITY,
  MOCK_ENGAGEMENT,
  MOCK_FUNNEL_STAGES,
  MOCK_KPIS,
  MOCK_SPONSORS,
  MOCK_TRAFFIC,
} from "./mockData"
import type {
  BoothLiveDto,
  CheckInSlotDto,
  CompetitionFunnelDto,
  DateRange,
  DivisionActivityDto,
  EngagementDto,
  FunnelDto,
  FunnelStageDto,
  KpiDto,
  LiveDto,
  LiveWebDto,
  OnSiteLiveDto,
  RecentEventDto,
  SponsorStatDto,
  TrafficDto,
  TrendDirection,
} from "./types"

/**
 * THE DATA SEAM. The only module a dashboard component may import for data; no panel imports
 * mockData.ts directly.
 *
 * Sources:
 *   - Web analytics: PostHog, through src/lib/analytics/posthog-query.ts (cached, server-only).
 *   - Registrations, check-ins, booth scans: Supabase with the service role.
 *   - Without PostHog query credentials (POSTHOG_PROJECT_ID + POSTHOG_PERSONAL_API_KEY), every
 *     adapter returns the mock figures and the page header says "Mock data".
 *
 * An adapter returns null when its live source fails; the page then shows that panel as
 * unavailable instead of a misleading zero.
 *
 * Sampled events (SAMPLE_RATES in src/lib/analytics/config.ts) are scaled back up here, so
 * counts are population estimates, not raw event counts.
 */

const DAY_MS = 24 * 60 * 60 * 1000
const RANGE_STEP_MS = 5 * 60 * 1000
const TIME_ZONE = "Asia/Jakarta"

export type DataSource = "live" | "mock"

export function dataSource(): DataSource {
  return isPostHogQueryConfigured() ? "live" : "mock"
}

/**
 * The last 7 days. `to` is rounded up to the next 5 minutes, so every request in that window
 * builds the same query and hits the same cache entry.
 */
export function defaultRange(now: Date = new Date()): DateRange {
  const to = new Date(Math.ceil(now.getTime() / RANGE_STEP_MS) * RANGE_STEP_MS)
  const from = new Date(to.getTime() - 7 * DAY_MS)
  return { from: from.toISOString(), to: to.toISOString() }
}

// ─── Query helpers ───────────────────────────────────────────────────────────

function bounds(range: DateRange) {
  const from = new Date(range.from)
  const to = new Date(range.to)
  return { from, to, days: Math.max(1, Math.round((to.getTime() - from.getTime()) / DAY_MS)) }
}

/** `timestamp` inside the range, plus the production-only filter on production. */
function inRange(range: DateRange): string {
  const { from, to } = bounds(range)
  return `timestamp >= ${sqlTime(from)} and timestamp < ${sqlTime(to)} ${envFilter()}`
}

/** HogQL expression giving each event its sampling weight (1-in-N events count N times). */
export function sampleWeight(): string {
  const cases = Object.entries(SAMPLE_RATES)
    .filter(([name, rate]) => /^[a-z_]+$/.test(name) && Number.isInteger(rate) && rate > 1)
    .map(([name, rate]) => `event = '${name}', ${rate}`)
  return cases.length > 0 ? `multiIf(${cases.join(", ")}, 1)` : "1"
}

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

function trend(current: number, previous: number): { delta: string; direction: TrendDirection } {
  if (previous === 0) return { delta: "no data for the previous 7 days", direction: "flat" }
  const change = Math.round(((current - previous) / previous) * 100)
  return {
    delta: `${Math.abs(change)}% vs previous 7 days`,
    direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
  }
}

function duration(seconds: number): string {
  const s = Math.round(seconds)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`
}

const UNAVAILABLE = "—"

// ─── Supabase reads ──────────────────────────────────────────────────────────

type HeadCount = { count: number | null; error: unknown }

async function eventCounts(range: DateRange) {
  try {
    const supabase = createServiceClient()
    const count = (table: string) => supabase.from(table).select("*", { count: "exact", head: true })
    const results = (await Promise.all([
      count("competition_registrations"),
      count("competition_registrations").eq("status", "verified"),
      count("visitor_tickets"),
      count("visitor_tickets").eq("checked_in", true),
      count("booth_scan_events"),
      count("gate_check_ins").gte("checked_in_at", range.from).lt("checked_in_at", range.to),
    ])) as HeadCount[]
    if (results.some((result) => result.error)) return null
    const [registrations, verified, tickets, checkedIn, boothScans, gateInRange] = results.map(
      (result) => result.count ?? 0,
    )
    return { registrations, verified, tickets, checkedIn, boothScans, gateInRange }
  } catch {
    return null
  }
}

async function competitionFunnel(): Promise<CompetitionFunnelDto[]> {
  try {
    const { data, error } = await createServiceClient().rpc("admin_competition_funnel")
    if (error || !Array.isArray(data)) return []
    return (data as Array<Record<string, unknown>>).map((row) => {
      const started = num(row.started)
      const completed = num(row.completed)
      return {
        competition_id: String(row.competition_id),
        competition_name: String(row.competition_name),
        started,
        completed,
        completion_rate_pct: pct(completed, started),
      }
    })
  } catch {
    return []
  }
}

// ─── Adapters ────────────────────────────────────────────────────────────────

export async function getKpis(range: DateRange): Promise<KpiDto[]> {
  if (dataSource() === "mock") return MOCK_KPIS

  const { from, to } = bounds(range)
  const previousFrom = new Date(from.getTime() - (to.getTime() - from.getTime()))
  const current = sqlTime(from)

  const [visitors, sessions, counts] = await Promise.all([
    hogql(
      "kpi-visitors",
      `select uniqIf(distinct_id, timestamp >= ${current}), uniqIf(distinct_id, timestamp < ${current})
       from events
       where event = '$pageview' and timestamp >= ${sqlTime(previousFrom)} and timestamp < ${sqlTime(to)} ${envFilter()}`,
    ),
    hogql(
      "kpi-sessions",
      `select avg(dur), avg(if(pv = 1, 1, 0)) from (
         select properties.$session_id as sid,
                dateDiff('second', min(timestamp), max(timestamp)) as dur,
                countIf(event = '$pageview') as pv
         from events
         where ${inRange(range)} and sid is not null
         group by sid
         having pv > 0
       )`,
    ),
    eventCounts(range),
  ])

  const visitorRow = visitors?.results[0]
  const sessionRow = sessions?.results[0]

  return [
    visitorRow
      ? {
          id: "visitors",
          label: "Unique Visitors",
          value: num(visitorRow[0]).toLocaleString("en-US"),
          ...trend(num(visitorRow[0]), num(visitorRow[1])),
        }
      : { id: "visitors", label: "Unique Visitors", value: UNAVAILABLE, delta: "PostHog unavailable", direction: "flat" },
    sessionRow
      ? {
          id: "session",
          label: "Avg Session",
          value: duration(num(sessionRow[0])),
          delta: `${Math.round(num(sessionRow[1]) * 100)}% single-page visits`,
          direction: "flat",
        }
      : { id: "session", label: "Avg Session", value: UNAVAILABLE, delta: "PostHog unavailable", direction: "flat" },
    counts
      ? {
          id: "registrations",
          label: "Registrations",
          value: counts.registrations.toLocaleString("en-US"),
          delta: `${counts.verified.toLocaleString("en-US")} verified`,
          direction: "flat",
        }
      : { id: "registrations", label: "Registrations", value: UNAVAILABLE, delta: "database unavailable", direction: "flat" },
    counts
      ? {
          id: "checkin",
          label: "Checked In",
          value: counts.checkedIn.toLocaleString("en-US"),
          delta: `${pct(counts.checkedIn, counts.tickets)}% of ${counts.tickets.toLocaleString("en-US")} tickets`,
          direction: "flat",
        }
      : { id: "checkin", label: "Checked In", value: UNAVAILABLE, delta: "database unavailable", direction: "flat" },
    counts
      ? {
          id: "booth-scans",
          label: "Booth Scans",
          value: counts.boothScans.toLocaleString("en-US"),
          delta: "QR scans, all time",
          direction: "flat",
        }
      : { id: "booth-scans", label: "Booth Scans", value: UNAVAILABLE, delta: "database unavailable", direction: "flat" },
  ]
}

export async function getDivisionActivity(range: DateRange): Promise<DivisionActivityDto[] | null> {
  if (dataSource() === "mock") return MOCK_DIVISION_ACTIVITY

  const result = await hogql(
    "division-activity",
    `select properties.division as division, sum(${sampleWeight()})
     from events
     where ${inRange(range)} and division is not null
     group by division`,
  )
  if (!result) return null

  const totals = new Map<DivisionTag, number>(DIVISION_ORDER.map((division) => [division, 0]))
  for (const [division, events] of result.results) {
    const tag = (DIVISION_ORDER as string[]).includes(String(division)) ? (division as DivisionTag) : "MISC"
    totals.set(tag, (totals.get(tag) ?? 0) + num(events))
  }
  const total = [...totals.values()].reduce((sum, value) => sum + value, 0)

  return [...totals.entries()]
    .map(([division, events]) => ({ division, events, share_pct: pct(events, total) }))
    .sort((a, b) => b.events - a.events)
}

/** Largest stage-to-stage loss, stated in words by the panel. */
function biggestDropoff(stages: FunnelStageDto[]) {
  let stage = stages[0]?.stage ?? ""
  let drop = 0
  for (let i = 1; i < stages.length; i += 1) {
    const previous = stages[i - 1]
    const current = stages[i]
    if (previous.count === 0) continue
    const dropPct = ((previous.count - current.count) / previous.count) * 100
    if (dropPct > drop) {
      drop = dropPct
      stage = `${previous.stage} → ${current.stage}`
    }
  }
  return { biggest_dropoff_stage: stage, biggest_dropoff_pct: Math.round(drop) }
}

function funnelStages(entries: Array<[string, number]>): FunnelStageDto[] {
  const entry = entries[0]?.[1] ?? 0
  return entries.map(([stage, count]) => ({ stage, count, pct_of_entry: pct(count, entry) }))
}

export async function getFunnel(range: DateRange): Promise<FunnelDto | null> {
  if (dataSource() === "mock") {
    return { stages: MOCK_FUNNEL_STAGES, competitions: MOCK_COMPETITIONS, ...biggestDropoff(MOCK_FUNNEL_STAGES) }
  }

  const [web, counts, competitions] = await Promise.all([
    hogql(
      "funnel",
      `select uniqIf(distinct_id, event = '$pageview'),
              uniqIf(distinct_id, event = 'funnel_step_enter' and properties.funnelId = 'signup'),
              uniqIf(distinct_id, event = 'funnel_step_complete' and properties.funnelId = 'signup')
       from events
       where ${inRange(range)} and event in ('$pageview', 'funnel_step_enter', 'funnel_step_complete')`,
    ),
    eventCounts(range),
    competitionFunnel(),
  ])
  const row = web?.results[0]
  if (!row) return null

  const stages = funnelStages([
    ["Visited site", num(row[0])],
    ["Opened sign-up", num(row[1])],
    ["Signed up", num(row[2])],
    ...(counts ? ([["Checked in (gate)", counts.gateInRange]] as Array<[string, number]>) : []),
  ])
  return { stages, competitions, ...biggestDropoff(stages) }
}

export async function getSponsorStats(range: DateRange): Promise<SponsorStatDto[] | null> {
  if (dataSource() === "mock") return [...MOCK_SPONSORS].sort((a, b) => b.ctr_percent - a.ctr_percent)

  // The marquee logs one impression for the whole section (logos scroll past), so every partner
  // in it shares that impression count; clicks are per partner.
  const result = await hogql(
    "sponsors",
    `select event, properties.sponsorId, sum(${sampleWeight()})
     from events
     where ${inRange(range)}
       and (event = 'sponsor_click' or (event = 'sponsor_impression' and properties.sectionId = '${MEDIA_PARTNERS_SECTION_ID}'))
     group by event, properties.sponsorId`,
  )
  if (!result) return null

  let impressions = 0
  const clicks = new Map<string, number>()
  for (const [event, id, count] of result.results) {
    if (event === "sponsor_impression") impressions += num(count)
    else if (typeof id === "string" && id !== "") clicks.set(id, (clicks.get(id) ?? 0) + num(count))
  }

  const rows: SponsorStatDto[] = MEDIA_PARTNERS.map((partner) => {
    const id = sponsorId(partner)
    const partnerClicks = clicks.get(id) ?? 0
    clicks.delete(id)
    return { sponsor_id: id, name: partner.alt, tier: partner.tier, impressions, clicks: partnerClicks, ctr_percent: 0 }
  })
  // Clicks on ids no longer in the list (a renamed or removed partner) stay visible.
  for (const [id, count] of clicks) {
    rows.push({ sponsor_id: id, name: id, tier: "—", impressions, clicks: count, ctr_percent: 0 })
  }

  return rows
    .map((row) => ({
      ...row,
      ctr_percent: row.impressions > 0 ? Math.round((row.clicks / row.impressions) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.ctr_percent - a.ctr_percent || b.clicks - a.clicks)
}

const BAILOUT_SCROLL = 0.2

export async function getEngagement(range: DateRange): Promise<EngagementDto | null> {
  if (dataSource() === "mock") return MOCK_ENGAGEMENT

  // PostHog reports how far the previous page was scrolled on the next $pageview / $pageleave.
  const scroll = "toFloat(properties.$prev_pageview_max_scroll_percentage)"
  const [devices, drone] = await Promise.all([
    hogql(
      "engagement-devices",
      `select properties.$device_type as device, avg(${scroll}), countIf(${scroll} < ${BAILOUT_SCROLL}), count()
       from events
       where ${inRange(range)} and event in ('$pageview', '$pageleave')
         and properties.$prev_pageview_max_scroll_percentage is not null
       group by device
       order by count() desc`,
    ),
    hogql(
      "engagement-drone",
      `select quantile(0.5)(toFloat(properties.readyMs)), quantile(0.9)(toFloat(properties.readyMs)), count()
       from events
       where ${inRange(range)} and event = 'drone_ready'`,
    ),
  ])
  if (!devices) return null

  const rows = devices.results.map(([device, avgScroll, bailouts, views]) => ({
    device_class: typeof device === "string" && device !== "" ? device : "Unknown",
    avg_scroll_depth: Math.round(num(avgScroll) * 100),
    early_bailouts: num(bailouts),
    total_sessions: num(views),
  }))
  const views = rows.reduce((sum, row) => sum + row.total_sessions, 0)
  const weighted = rows.reduce((sum, row) => sum + row.avg_scroll_depth * row.total_sessions, 0)

  const droneRow = drone?.results[0]
  const droneSamples = droneRow ? num(droneRow[2]) : 0
  const p50 = droneSamples > 0 ? Math.round(num(droneRow?.[0])) : null
  const p90 = droneSamples > 0 ? Math.round(num(droneRow?.[1])) : null

  // Flag the device class where the most page views end before 20% scroll, once there is
  // enough data for the share to mean something.
  const worst = rows
    .filter((row) => row.total_sessions >= 20)
    .map((row) => ({ ...row, share: pct(row.early_bailouts, row.total_sessions) }))
    .sort((a, b) => b.share - a.share)[0]
  const alert =
    worst && worst.share >= 30
      ? `${worst.share}% of ${worst.device_class.toLowerCase()} page views end before 20% scroll.` +
        (p90 !== null && p90 > 3000 ? ` Drone p90 is ${(p90 / 1000).toFixed(1)}s: check load time before content.` : "")
      : null

  return {
    avg_scroll_depth_pct: views > 0 ? Math.round(weighted / views) : 0,
    drone_ready_ms_p50: p50,
    drone_ready_ms_p90: p90,
    devices: rows,
    alert,
  }
}

const DAY_KEY = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" })
const DAY_LABEL = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, month: "short", day: "numeric" })

export async function getTraffic(range: DateRange): Promise<TrafficDto | null> {
  if (dataSource() === "mock") return MOCK_TRAFFIC

  const [daily, pages] = await Promise.all([
    hogql(
      "traffic-daily",
      `select toString(toDate(toTimeZone(timestamp, '${TIME_ZONE}'))) as day, count()
       from events
       where event = '$pageview' and ${inRange(range)}
       group by day`,
    ),
    hogql(
      "traffic-pages",
      `select properties.$pathname as path, count()
       from events
       where event = '$pageview' and ${inRange(range)} and path is not null
       group by path
       order by count() desc
       limit 5`,
    ),
  ])
  if (!daily || !pages) return null

  const views = new Map(daily.results.map(([day, count]) => [String(day), num(count)]))
  const { to, days } = bounds(range)
  const series = Array.from({ length: days }, (_, i) => {
    // The last `days` calendar days in Jakarta, ending with the one `to` falls in.
    const date = new Date(to.getTime() - 1 - (days - 1 - i) * DAY_MS)
    return { day: DAY_LABEL.format(date), views: views.get(DAY_KEY.format(date)) ?? 0 }
  })

  return {
    series,
    top_pages: pages.results.map(([path, count]) => ({ page_path: String(path), views: num(count) })),
  }
}

/** Our own event properties: PostHog's `$…` properties and the ones we set on every event are left out. */
const HIDDEN_PROPERTIES = new Set(["app_env", "division", "page_path", "token", "distinct_id"])

function ownMetadata(raw: unknown): RecentEventDto["metadata"] {
  let properties: unknown = raw
  if (typeof raw === "string") {
    try {
      properties = JSON.parse(raw)
    } catch {
      return {}
    }
  }
  if (!properties || typeof properties !== "object") return {}

  const out: RecentEventDto["metadata"] = {}
  for (const [key, value] of Object.entries(properties)) {
    if (key.startsWith("$") || HIDDEN_PROPERTIES.has(key)) continue
    if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
      out[key] = value as string | number | boolean | null
    }
  }
  return out
}

/** Latest events across the site (last 7 days), refreshed every 30 s. */
export async function getRecentEvents(limit: number): Promise<RecentEventDto[] | null> {
  if (dataSource() === "mock") return []

  const rows = Math.min(200, Math.max(1, Math.floor(limit)))
  const result = await hogql(
    "recent-events",
    `select uuid, event, properties.division, properties.$pathname, properties, timestamp
     from events
     where timestamp >= now() - interval 7 day ${envFilter()}
     order by timestamp desc
     limit ${rows}`,
    LIVE_TTL,
  )
  if (!result) return null

  return result.results.map(([id, event, division, path, properties, timestamp]) => ({
    id: String(id),
    event_type: String(event),
    division: (DIVISION_ORDER as string[]).includes(String(division)) ? (division as DivisionTag) : null,
    page_path: typeof path === "string" ? path : "",
    metadata: ownMetadata(properties),
    created_at: String(timestamp),
  }))
}

// ─── D-day live ──────────────────────────────────────────────────────────────

const SLOT_MS = 15 * 60 * 1000

/** One RPC (migration 0017) for the whole on-site picture, shared by every admin for 30 s. */
const fetchOnSite = unstable_cache(
  async (since: string): Promise<unknown> => {
    const { data, error } = await createServiceClient().rpc("admin_live_onsite", {
      p_since: since,
      p_visit_seconds: VISIT_MIN_SECONDS,
    })
    // Thrown, not returned, so a failure is not cached.
    if (error) throw new Error(error.message)
    return data
  },
  ["admin-live-onsite"],
  { revalidate: LIVE_TTL, tags: ["admin-live"] },
)

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
const list = (value: unknown): Record<string, unknown>[] => (Array.isArray(value) ? value.map(record) : [])
const maybeNum = (value: unknown): number | null => (value === null || value === undefined ? null : num(value))

/** 15-minute slots from the first check-in to the slot `now` falls in, gaps as zero. */
function fillSlots(raw: Record<string, unknown>[], since: Date, now: Date): CheckInSlotDto[] {
  const counts = new Map<number, number>()
  for (const row of raw) {
    const at = new Date(String(row.slot)).getTime()
    if (Number.isFinite(at)) counts.set(at, num(row.count))
  }
  if (counts.size === 0) return []

  const first = Math.min(...counts.keys())
  const current = since.getTime() + Math.floor((now.getTime() - since.getTime()) / SLOT_MS) * SLOT_MS
  const last = Math.max(current, ...counts.keys())
  const slots: CheckInSlotDto[] = []
  for (let at = first; at <= last; at += SLOT_MS) {
    slots.push({ slot: new Date(at).toISOString(), count: counts.get(at) ?? 0 })
  }
  return slots
}

function toOnSite(raw: unknown, since: Date, now: Date): OnSiteLiveDto {
  const data = record(raw)
  const venue = record(data.venue)
  const checkedIn = num(data.checked_in)
  const measured = num(venue.measured)

  const booths: BoothLiveDto[] = list(data.booths).map((row) => ({
    booth_id: String(row.booth_id),
    name: String(row.name ?? ""),
    scans: num(row.scans),
    visits: num(row.visits),
    visitors: num(row.visitors),
    median_dwell_s: maybeNum(row.median_dwell_s),
    avg_dwell_s: maybeNum(row.avg_dwell_s),
  }))

  return {
    checked_in: checkedIn,
    active_now: num(data.active_now),
    presence_users: num(data.presence_users),
    slots: fillSlots(list(data.slots), since, now),
    booths,
    venue: {
      measured,
      unmeasured: Math.max(0, checkedIn - measured),
      median_s: maybeNum(venue.median_s),
      buckets: [
        { label: "Under 30 min", count: num(venue.under_30m) },
        { label: "30–60 min", count: num(venue.from_30m_to_1h) },
        { label: "1–2 h", count: num(venue.from_1h_to_2h) },
        { label: "Over 2 h", count: num(venue.over_2h) },
      ],
    },
  }
}

async function getLiveWeb(): Promise<LiveWebDto | null> {
  const [active, pages] = await Promise.all([
    hogql(
      "live-active",
      `select uniq(distinct_id) from events where timestamp >= now() - interval 5 minute ${envFilter()}`,
      LIVE_TTL,
    ),
    hogql(
      "live-pages",
      `select properties.$pathname as path, count()
       from events
       where event = '$pageview' and timestamp >= now() - interval 30 minute ${envFilter()} and path is not null
       group by path
       order by count() desc
       limit 5`,
      LIVE_TTL,
    ),
  ])
  if (!active || !pages) return null
  return {
    active_visitors: num(active.results[0]?.[0]),
    top_pages: pages.results.map(([path, count]) => ({ page_path: String(path), views: num(count) })),
  }
}

/**
 * Today (Jakarta) on site, plus the website right now. Supabase is always live here (the mock
 * fallback is for PostHog only); PostHog figures are null without query credentials.
 */
export async function getLive(now: Date = new Date()): Promise<LiveDto> {
  const since = startOfJakartaDay(now)
  const webConfigured = isPostHogQueryConfigured()

  const [onsite, web] = await Promise.all([
    fetchOnSite(since)
      .then((raw) => toOnSite(raw, new Date(since), now))
      .catch((err: unknown) => {
        console.error("[admin live] on-site query failed:", err instanceof Error ? err.message : err)
        return null
      }),
    webConfigured ? getLiveWeb() : Promise.resolve(null),
  ])

  return { generated_at: now.toISOString(), since, onsite, web, web_configured: webConfigured }
}
