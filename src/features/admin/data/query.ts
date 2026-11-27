import "server-only"

import { SAMPLE_RATES } from "@/lib/analytics/config"
import { envFilter, sqlTime } from "@/lib/analytics/posthog-query"
import { createServiceClient } from "@/lib/supabase/server"

import type { DateRange } from "./types"

/**
 * Helpers shared by the admin adapters (adapters.ts and the per-page adapter modules it
 * re-exports). Queries are built only from constants and server-computed dates.
 */

export const DAY_MS = 24 * 60 * 60 * 1000
export const TIME_ZONE = "Asia/Jakarta"
const RANGE_STEP_MS = 5 * 60 * 1000

/**
 * The last `days` days. `to` is rounded up to the next 5 minutes, so every request in that window
 * builds the same query and hits the same cache entry.
 */
export function lastDays(days: number, now: Date = new Date()): DateRange {
  const to = new Date(Math.ceil(now.getTime() / RANGE_STEP_MS) * RANGE_STEP_MS)
  const from = new Date(to.getTime() - days * DAY_MS)
  return { from: from.toISOString(), to: to.toISOString() }
}

export function bounds(range: DateRange) {
  const from = new Date(range.from)
  const to = new Date(range.to)
  return { from, to, days: Math.max(1, Math.round((to.getTime() - from.getTime()) / DAY_MS)) }
}

/** `timestamp` inside the range, plus the production-only filter on production. */
export function inRange(range: DateRange): string {
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

export const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

const DAY_KEY = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" })

/** The Jakarta calendar day of an instant, "YYYY-MM-DD". */
export const jakartaDay = (date: Date) => DAY_KEY.format(date)

/**
 * The last `days` Jakarta calendar days ending with the one `to` falls in, oldest first, as
 * "YYYY-MM-DD" keys.
 */
export function dayKeys(to: Date, days: number): string[] {
  return Array.from({ length: days }, (_, i) => jakartaDay(new Date(to.getTime() - 1 - (days - 1 - i) * DAY_MS)))
}

/**
 * Every row of a Supabase select, paging past PostgREST's 1000-row cap. `build` must return a
 * fresh, ordered query each time. Throws on the first error.
 */
export async function selectAll<T>(
  build: (supabase: ReturnType<typeof createServiceClient>) => {
    range: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>
  },
  pageSize = 1000,
  maxRows = 20_000,
): Promise<T[]> {
  const supabase = createServiceClient()
  const rows: T[] = []
  for (let from = 0; from < maxRows; from += pageSize) {
    const { data, error } = await build(supabase).range(from, from + pageSize - 1)
    if (error) throw error instanceof Error ? error : new Error(JSON.stringify(error))
    const page = Array.isArray(data) ? (data as T[]) : []
    rows.push(...page)
    if (page.length < pageSize) break
  }
  return rows
}
