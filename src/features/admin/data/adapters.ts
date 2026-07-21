import { readRecent } from "@/lib/analytics/server/eventStore"
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
  DateRange,
  DivisionActivityDto,
  EngagementDto,
  FunnelDto,
  KpiDto,
  RecentEventDto,
  SponsorStatDto,
  TrafficDto,
} from "./types"

/**
 * THE DATA SEAM.
 *
 * This is the only module a dashboard component may import for data. No panel
 * ever imports mockData.ts directly — that single rule is what keeps swapping
 * to a real database a small diff rather than a rewrite of the panel tree.
 *
 * Three conventions make that swap cheap:
 *
 *   1. Every adapter is already async, even though most return a literal
 *      today. Call sites already await inside Server Components, so adding a
 *      real `await db.query(...)` changes nothing above this line.
 *   2. DTO field names mirror the SQL columns in docs/analytics/schema.sql,
 *      so each body becomes close to a literal SELECT.
 *   3. The seam does not distinguish "mock" from "live", only "above" from
 *      "below" — getRecentEvents already reads real state and has the same
 *      shape as the rest.
 *
 * `range` is accepted and currently ignored by the mock adapters. It is in the
 * signature now so the date-range control can be added later without touching
 * a single call site.
 */

export async function getKpis(_range: DateRange): Promise<KpiDto[]> {
  // Real: several aggregate queries, or one scheduled rollup table.
  return MOCK_KPIS
}

export async function getDivisionActivity(_range: DateRange): Promise<DivisionActivityDto[]> {
  // Real: SELECT division, COUNT(*) FROM events WHERE created_at BETWEEN … GROUP BY division
  return MOCK_DIVISION_ACTIVITY
}

export async function getFunnel(_range: DateRange): Promise<FunnelDto> {
  // Real: the registration funnel drop-off query in schema.sql.
  const stages = MOCK_FUNNEL_STAGES

  // Derived here rather than hard-coded so it stays correct when the stage
  // numbers become real.
  let biggestStage = stages[0]?.stage ?? ""
  let biggestDrop = 0

  for (let i = 1; i < stages.length; i += 1) {
    const previous = stages[i - 1]
    const current = stages[i]
    if (previous.count === 0) continue

    const dropPct = ((previous.count - current.count) / previous.count) * 100
    if (dropPct > biggestDrop) {
      biggestDrop = dropPct
      biggestStage = `${previous.stage} → ${current.stage}`
    }
  }

  return {
    stages,
    competitions: MOCK_COMPETITIONS,
    biggest_dropoff_stage: biggestStage,
    biggest_dropoff_pct: Math.round(biggestDrop),
  }
}

export async function getSponsorStats(_range: DateRange): Promise<SponsorStatDto[]> {
  // Real: SELECT * FROM sponsor_stats ORDER BY ctr_percent DESC
  return [...MOCK_SPONSORS].sort((a, b) => b.ctr_percent - a.ctr_percent)
}

export async function getEngagement(_range: DateRange): Promise<EngagementDto> {
  // Real: the scroll-depth-by-device-class query in schema.sql, plus a
  // percentile over drone_ready event metadata.
  return MOCK_ENGAGEMENT
}

export async function getTraffic(_range: DateRange): Promise<TrafficDto> {
  // Real: the daily traffic + top pages query in schema.sql.
  return MOCK_TRAFFIC
}

/**
 * The one adapter reading live state. Backed by the in-memory ring buffer, so
 * it shows a partial, volatile slice of traffic — see the scope note in
 * src/lib/analytics/server/eventStore.ts. Same shape as the others, so it
 * swaps to `SELECT … ORDER BY created_at DESC LIMIT $1` the same way.
 */
export async function getRecentEvents(limit: number): Promise<RecentEventDto[]> {
  return readRecent(limit).map((event) => ({
    id: event.id,
    event_type: event.event_type,
    division: event.division,
    page_path: event.page_path,
    metadata: event.metadata,
    created_at: event.created_at,
  }))
}

/** Default range used by the dashboard until a date picker exists. */
export function defaultRange(): DateRange {
  const to = new Date()
  const from = new Date(to.getTime() - 6 * 24 * 60 * 60 * 1000)
  return { from: from.toISOString(), to: to.toISOString() }
}
