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
