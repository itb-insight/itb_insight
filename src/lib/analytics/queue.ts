// Client-side analytics queue. Buffers events and flushes them to Supabase in BATCHES —
// one bulk INSERT per flush, never one request per event — so we don't overwhelm the DB.
//
// Flush triggers: buffer reaches BATCH_SIZE, a periodic timer, or the page is hidden/unloaded
// (best-effort via `fetch(..., { keepalive: true })`). Writes go to the anon REST endpoint;
// the `analytics_events` RLS policy allows INSERT only, so the anon key is safe here.

type AnalyticsEvent = {
  session_id: string
  event_name: string
  path: string | null
  props: Record<string, unknown>
}

const BATCH_SIZE = 15
const SESSION_KEY = 'itb_insight_analytics_session'

let queue: AnalyticsEvent[] = []
let flushing = false

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function isEnabled() {
  return typeof window !== 'undefined' && Boolean(SUPABASE_URL) && Boolean(SUPABASE_ANON_KEY)
}

function getSessionId() {
  if (typeof window === 'undefined') return 'server'
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id = (crypto?.randomUUID?.() ?? `s-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      window.sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return 'no-storage'
  }
}

export function trackEvent(eventName: string, path: string | null, props: Record<string, unknown> = {}) {
  if (!isEnabled()) return

  queue.push({ session_id: getSessionId(), event_name: eventName, path, props })

  if (queue.length >= BATCH_SIZE) {
    void flushEvents()
  }
}

export async function flushEvents(options: { keepalive?: boolean } = {}) {
  if (!isEnabled() || flushing || queue.length === 0) return

  flushing = true
  const batch = queue
  queue = []

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/analytics_events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(batch),
      keepalive: options.keepalive ?? false,
    })

    // On failure, requeue so the events aren't lost (best-effort; capped by BATCH_SIZE growth).
    if (!response.ok) {
      queue = batch.concat(queue)
    }
  } catch {
    queue = batch.concat(queue)
  } finally {
    flushing = false
  }
import { ENDPOINT, FLUSH_INTERVAL_MS, MAX_BATCH } from "./config"
import { getDeviceInfo, getSessionId } from "./session"
import type { TrackBatch, TrackedEvent } from "./types"

/**
 * Client-side event queue.
 *
 * Events accumulate in memory and drain on a timer, on a full batch, or when
 * the page is being backgrounded. This is the whole point of the batching
 * requirement: sponsor hovers and scroll ticks add up fast, and one request
 * per event would hammer the endpoint.
 */

let buffer: TrackedEvent[] = []
let timer: ReturnType<typeof setInterval> | null = null
let listenersAttached = false

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

function send(batch: TrackBatch): void {
  const body = JSON.stringify(batch)

  // sendBeacon survives page unload, which fetch generally does not. It needs
  // an explicit Blob type or the server sees no content type.
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" })
    if (navigator.sendBeacon(ENDPOINT, blob)) return
  }

  // keepalive lets the request outlive the document in browsers without a
  // working sendBeacon. Failures are swallowed: analytics must never surface
  // an error to a visitor.
  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {})
}

export function flush(): void {
  if (buffer.length === 0) return

  const events = buffer
  buffer = []

  send({
    sessionId: getSessionId(),
    device: getDeviceInfo(),
    events,
  })
}

function handleHide(): void {
  if (document.visibilityState === "hidden") flush()
}

/**
 * Registers lifecycle listeners once. Called lazily on the first enqueue so
 * that a page emitting no events attaches nothing at all.
 */
function ensureStarted(): void {
  if (listenersAttached || typeof window === "undefined") return
  listenersAttached = true

  timer = setInterval(flush, FLUSH_INTERVAL_MS)

  // visibilitychange + pagehide, deliberately NOT beforeunload: beforeunload is
  // unreliable on mobile Safari and it disqualifies the page from bfcache.
  document.addEventListener("visibilitychange", handleHide)
  window.addEventListener("pagehide", flush)
}

export function enqueue(event: TrackedEvent): void {
  if (typeof window === "undefined") return

  ensureStarted()
  buffer.push(event)

  if (buffer.length >= MAX_BATCH) flush()
}

/** Exposed for tests and HMR teardown; not part of the public tracking API. */
export function stop(): void {
  if (timer) clearInterval(timer)
  timer = null
  if (typeof window !== "undefined") {
    document.removeEventListener("visibilitychange", handleHide)
    window.removeEventListener("pagehide", flush)
  }
  listenersAttached = false
}
