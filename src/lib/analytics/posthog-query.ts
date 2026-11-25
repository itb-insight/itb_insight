import "server-only"

import { unstable_cache } from "next/cache"

/**
 * Reads numbers back from PostHog for /admin (HogQL over the query API).
 *
 * Needs, on the server only:
 *   POSTHOG_PROJECT_ID          numeric project id
 *   POSTHOG_PERSONAL_API_KEY    personal key with only the query:read scope, never NEXT_PUBLIC
 *   NEXT_PUBLIC_POSTHOG_REGION  "us" or "eu"
 *
 * Results are cached in Next's data cache (`revalidate` seconds, shared by every admin), which
 * keeps us far inside PostHog's query rate limits however many dashboards are open. Failures are
 * not cached: they return null, and the panel shows "unavailable".
 *
 * Queries are built only from constants and server-computed dates (see `sqlTime`), never from
 * request input.
 */

export type HogQLRow = unknown[]

export interface HogQLResult {
  columns: string[]
  results: HogQLRow[]
}

/** Historical panels: 5 minutes. D-day live panels use LIVE_TTL. */
export const HISTORY_TTL = 300
export const LIVE_TTL = 30

const QUERY_TIMEOUT_MS = 10_000

function settings() {
  const projectId = process.env.POSTHOG_PROJECT_ID?.trim() ?? ""
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY?.trim() ?? ""
  const region = process.env.NEXT_PUBLIC_POSTHOG_REGION
  if (!/^\d+$/.test(projectId) || apiKey === "" || (region !== "us" && region !== "eu")) return null
  return { projectId, apiKey, host: `https://${region}.posthog.com` }
}

export function isPostHogQueryConfigured(): boolean {
  return settings() !== null
}

/**
 * One PostHog project serves every environment (free plan). Production dashboards count only
 * production traffic; previews and local dev see everything, which is what you want when testing.
 */
export function envFilter(): string {
  const env = process.env.VERCEL_ENV ?? process.env.NEXT_PUBLIC_VERCEL_ENV
  return env === "production" ? "and properties.app_env = 'production'" : ""
}

/** A Date as a HogQL UTC datetime literal. Only ever fed server-computed dates. */
export function sqlTime(date: Date): string {
  if (Number.isNaN(date.getTime())) throw new Error("sqlTime: invalid date")
  const iso = date.toISOString().slice(0, 19).replace("T", " ")
  return `toDateTime('${iso}', 'UTC')`
}

async function runQuery(name: string, query: string): Promise<HogQLResult> {
  const config = settings()
  if (!config) throw new Error("PostHog query API is not configured")

  const response = await fetch(`${config.host}/api/projects/${config.projectId}/query/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: `admin:${name}`, query: { kind: "HogQLQuery", query } }),
    cache: "no-store",
    signal: AbortSignal.timeout(QUERY_TIMEOUT_MS),
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new Error(`PostHog query "${name}" failed with ${response.status}: ${detail.slice(0, 200)}`)
  }

  const body = (await response.json()) as { results?: unknown; columns?: unknown }
  if (!Array.isArray(body.results)) throw new Error(`PostHog query "${name}" returned no results`)
  return {
    columns: Array.isArray(body.columns) ? body.columns.map(String) : [],
    results: body.results as HogQLRow[],
  }
}

/**
 * Runs a HogQL query through the shared cache. Resolves to null when the API is not configured
 * or the query fails; callers treat null as "unavailable".
 */
export async function hogql(name: string, query: string, ttlSeconds: number = HISTORY_TTL): Promise<HogQLResult | null> {
  if (!isPostHogQueryConfigured()) return null
  try {
    const cached = unstable_cache(() => runQuery(name, query), ["posthog-query", name, query], {
      revalidate: ttlSeconds,
      tags: ["posthog"],
    })
    return await cached()
  } catch (error) {
    console.warn("[posthog-query]", error instanceof Error ? error.message : error)
    return null
  }
}

/** Numeric cell → number (HogQL returns counts as numbers, averages may be null). */
export function num(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
