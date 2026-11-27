import type { PostHog } from "posthog-js"
import { loadPostHog } from "./posthog"
import type { TrackedEvent } from "./types"

/**
 * Client-side hand-off to PostHog.
 *
 * PostHog batches and retries on its own, so this module only covers the gap before the SDK has
 * loaded (it loads lazily, on idle): events wait in a small capped buffer and are delivered with
 * their original timestamps once it is ready. With no PostHog key configured, events are dropped.
 */

/** Events kept while PostHog loads. Oldest are dropped beyond this. */
export const MAX_PENDING = 100

let pending: TrackedEvent[] = []
let client: PostHog | null = null
let state: "idle" | "loading" | "ready" | "disabled" = "idle"

/**
 * StrictMode dedupe. React double-invokes effects in dev, so impressions and
 * funnel steps would fire twice and every dev number would read 2x. Call
 * sites that must fire once per session pass a dedupe key.
 */
const seenKeys = new Set<string>()

export function alreadySeen(key: string): boolean {
  if (seenKeys.has(key)) return true
  seenKeys.add(key)
  return false
}

function send(posthog: PostHog, event: TrackedEvent): void {
  try {
    posthog.capture(
      event.name,
      { ...event.metadata, division: event.division, page_path: event.pagePath },
      {
        timestamp: new Date(event.ts),
        // The page is going away: send now with a beacon instead of waiting for the batch.
        ...(event.urgent ? { transport: "sendBeacon" as const, send_instantly: true } : {}),
      },
    )
  } catch {
    // Analytics must never surface an error to a visitor.
  }
}

function start(): void {
  if (state !== "idle") return
  state = "loading"

  void loadPostHog().then((posthog) => {
    if (!posthog) {
      state = "disabled"
      pending = []
      return
    }
    client = posthog
    state = "ready"
    const queued = pending
    pending = []
    for (const event of queued) send(posthog, event)
  })
}

export function enqueue(event: TrackedEvent): void {
  if (typeof window === "undefined" || state === "disabled") return

  if (state === "ready" && client) {
    send(client, event)
    return
  }

  if (pending.length >= MAX_PENDING) pending.shift()
  pending.push(event)
  start()
}

/** Starts loading PostHog without waiting for the first custom event (page views come from it). */
export function startAnalytics(): void {
  if (typeof window === "undefined") return
  start()
}

/** Test-only: back to a fresh, unloaded state. */
export function resetQueueForTests(): void {
  pending = []
  client = null
  state = "idle"
  seenKeys.clear()
}

/** Test-only: number of events waiting for PostHog. */
export function pendingCount(): number {
  return pending.length
}
