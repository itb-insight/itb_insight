import "server-only"

import { hogql, isPostHogQueryConfigured, num } from "@/lib/analytics/posthog-query"
import { createServiceClient } from "@/lib/supabase/server"

import { MOCK_WEB } from "./mockData"
import { bounds, dayKeys, inRange, lastDays, pct } from "./query"
import type {
  DateRange,
  TrafficSourceDto,
  TrafficSourceKey,
  WebDayDto,
  WebFunnelStepDto,
  WebInsightsDto,
  WebSummaryDto,
} from "./types"

/** Summary cards, traffic sources and the funnel cover this many days. */
export const WEB_SUMMARY_DAYS = 30
/** The visits chart's "Total" tab goes back this far. */
export const WEB_HISTORY_DAYS = 120

export const TRAFFIC_SOURCES: Array<{ key: TrafficSourceKey; label: string }> = [
  { key: "instagram", label: "Instagram" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "search", label: "Search" },
  { key: "direct", label: "Direct link" },
  { key: "tiktok", label: "TikTok" },
  { key: "x", label: "X" },
  { key: "other", label: "Lainnya" },
]

const SEARCH_ENGINES = /(^|\.)(google|bing|yahoo|duckduckgo|yandex|ecosia|baidu|search\.brave)\./

function siteHost(): string | null {
  try {
    const url = process.env.NEXT_PUBLIC_SITE_URL
    return url ? new URL(url).hostname.replace(/^www\./, "") : null
  } catch {
    return null
  }
}

/**
 * A session's source from its first page view: `utm_source` when the link was tagged, otherwise
 * the referring domain. No referrer (PostHog's "$direct"), or our own domain, is a direct visit;
 * WhatsApp and most in-app browsers send no referrer, so untagged shares land there too.
 */
export function classifySource(utm: unknown, referrer: unknown, ownHost: string | null = siteHost()): TrafficSourceKey {
  const tag = typeof utm === "string" ? utm.trim().toLowerCase() : ""
  const domain = typeof referrer === "string" ? referrer.trim().toLowerCase().replace(/^www\./, "") : ""
  const text = tag || domain

  if (text === "" || text === "$direct") return "direct"
  if (ownHost && (domain === ownHost || domain.endsWith(`.${ownHost}`)) && !tag) return "direct"
  if (text.includes("instagram") || text === "ig") return "instagram"
  if (text.includes("whatsapp") || text === "wa" || text === "wa.me") return "whatsapp"
  if (text.includes("tiktok")) return "tiktok"
  if (text === "t.co" || text === "x" || text === "x.com" || text.includes("twitter")) return "x"
  if (tag === "google" || tag === "search" || SEARCH_ENGINES.test(domain)) return "search"
  return "other"
}

async function summary(range: DateRange): Promise<WebSummaryDto | null> {
  const [visits, sessions] = await Promise.all([
    hogql(
      "web-summary-visits",
      `select count(), uniq(distinct_id)
       from events
       where event = '$pageview' and ${inRange(range)}`,
    ),
    hogql(
      "web-summary-sessions",
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
  ])
  const visitRow = visits?.results[0]
  const sessionRow = sessions?.results[0]
  if (!visitRow || !sessionRow) return null
  return {
    pageviews: num(visitRow[0]),
    visitors: num(visitRow[1]),
    avg_session_s: Math.round(num(sessionRow[0])),
    bounce_pct: Math.round(num(sessionRow[1]) * 100),
  }
}

async function daily(range: DateRange): Promise<WebDayDto[] | null> {
  const result = await hogql(
    "web-daily",
    `select toString(toDate(toTimeZone(timestamp, 'Asia/Jakarta'))) as day, count(), uniq(distinct_id)
     from events
     where event = '$pageview' and ${inRange(range)}
     group by day`,
  )
  if (!result) return null

  const byDay = new Map(result.results.map(([day, views, visitors]) => [String(day), { pageviews: num(views), visitors: num(visitors) }]))
  const { to, days } = bounds(range)
  const series = dayKeys(to, days).map((day) => ({ day, ...(byDay.get(day) ?? { pageviews: 0, visitors: 0 }) }))
  const first = series.findIndex((row) => row.pageviews > 0)
  // Keep at least two weeks so the 14-day tab is never shorter than its name.
  return first === -1 ? series.slice(-14) : series.slice(Math.min(first, Math.max(0, series.length - 14)))
}

async function sources(range: DateRange): Promise<TrafficSourceDto[] | null> {
  const result = await hogql(
    "web-sources",
    `select utm, ref, count() from (
       select properties.$session_id as sid,
              argMin(properties.utm_source, timestamp) as utm,
              argMin(properties.$referring_domain, timestamp) as ref
       from events
       where event = '$pageview' and ${inRange(range)} and sid is not null
       group by sid
     )
     group by utm, ref
     order by count() desc
     limit 1000`,
  )
  if (!result) return null

  const host = siteHost()
  const totals = new Map<TrafficSourceKey, number>(TRAFFIC_SOURCES.map(({ key }) => [key, 0]))
  for (const [utm, ref, count] of result.results) {
    const key = classifySource(utm, ref, host)
    totals.set(key, (totals.get(key) ?? 0) + num(count))
  }
  return TRAFFIC_SOURCES.map(({ key }) => ({ source: key, sessions: totals.get(key) ?? 0 }))
}

async function paidRegistrations(range: DateRange): Promise<number | null> {
  try {
    const { count, error } = await createServiceClient()
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("status", "paid")
      .eq("provider", "midtrans")
      .gte("paid_at", range.from)
      .lt("paid_at", range.to)
    return error ? null : (count ?? 0)
  } catch {
    return null
  }
}

/**
 * Where visitors stop: distinct browsers that saw the landing page, finished sign-up, and opened
 * a competition registration form (PostHog), then Midtrans payments settled in the same window
 * (Supabase; manual and imported payments are left out).
 */
async function funnel(range: DateRange): Promise<WebFunnelStepDto[] | null> {
  const [web, paid] = await Promise.all([
    hogql(
      "web-funnel",
      `select uniqIf(distinct_id, event = '$pageview' and properties.$pathname = '/'),
              uniqIf(distinct_id, event = 'funnel_step_complete' and properties.funnelId = 'signup'),
              uniqIf(distinct_id, event = '$pageview' and startsWith(properties.$pathname, '/register'))
       from events
       where ${inRange(range)} and event in ('$pageview', 'funnel_step_complete')`,
    ),
    paidRegistrations(range),
  ])
  const row = web?.results[0]
  if (!row) return null
  return [
    { step: "Landing page", count: num(row[0]) },
    { step: "Sign up", count: num(row[1]) },
    { step: "Daftar lomba", count: num(row[2]) },
    ...(paid === null ? [] : [{ step: "Bayar", count: paid }]),
  ]
}

/** Everything on /admin/web. Mock figures without PostHog query credentials. */
export async function getWebInsights(now: Date = new Date()): Promise<WebInsightsDto> {
  if (!isPostHogQueryConfigured()) return MOCK_WEB

  const recent = lastDays(WEB_SUMMARY_DAYS, now)
  const history = lastDays(WEB_HISTORY_DAYS, now)
  const [summaryDto, dailyDto, sourcesDto, funnelDto] = await Promise.all([
    summary(recent),
    daily(history),
    sources(recent),
    funnel(recent),
  ])
  return { summary: summaryDto, daily: dailyDto, sources: sourcesDto, funnel: funnelDto }
}

/** Bar lengths for the funnel: each step as a share of the first. */
export function funnelShares(steps: WebFunnelStepDto[]): Array<WebFunnelStepDto & { share: number }> {
  const entry = steps[0]?.count ?? 0
  return steps.map((step) => ({ ...step, share: pct(step.count, entry) }))
}
