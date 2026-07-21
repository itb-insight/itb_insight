import { EVENT_STORE_CAPACITY } from "../config"
import type { DeviceInfo, StoredEvent } from "../types"
import type { ValidatedBatch } from "./validate"

/**
 * In-memory ring buffer backing the Recent Events feed.
 *
 * SCOPE — read this before using it for anything else:
 * This buffer feeds the Recent Events panel and NOTHING else. Every KPI, CTR,
 * funnel rate and sparkline on the dashboard comes from the mock layer in
 * src/features/admin/data. The buffer is per-process: it empties on restart
 * and each serverless instance holds its own copy, so it shows an arbitrary
 * partial slice of traffic. It exists to prove ingest works end to end. It is
 * not an analytics store. See docs/analytics/99-known-gaps.md.
 */

interface Store {
  buf: (StoredEvent | undefined)[]
  head: number
  count: number
  nextId: number
}

/**
 * Pinned to a Symbol.for key so Turbopack HMR reattaches to the same buffer
 * instead of clearing the feed on every file save during development.
 */
const STORE_KEY = Symbol.for("itb.analytics.eventStore")

type GlobalWithStore = typeof globalThis & { [STORE_KEY]?: Store }

function getStore(): Store {
  const g = globalThis as GlobalWithStore
  g[STORE_KEY] ??= {
    buf: new Array<StoredEvent | undefined>(EVENT_STORE_CAPACITY),
    head: 0,
    count: 0,
    nextId: 1,
  }
  return g[STORE_KEY]
}

function toStored(
  event: ValidatedBatch["events"][number],
  sessionId: string,
  device: DeviceInfo,
  id: number,
): StoredEvent {
  return {
    id,
    session_id: sessionId,
    // Hardcoded null, never accepted from the client. Anonymous stays anonymous.
    user_id: null,
    event_type: event.name,
    division: event.division,
    page_path: event.pagePath,
    metadata: event.metadata,
    device_type: device.deviceType,
    browser: device.browser,
    os: device.os,
    created_at: new Date().toISOString(),
  }
}

export function appendBatch(batch: ValidatedBatch): number {
  const store = getStore()

  for (const event of batch.events) {
    store.buf[store.head] = toStored(event, batch.sessionId, batch.device, store.nextId)
    store.head = (store.head + 1) % EVENT_STORE_CAPACITY
    store.count = Math.min(store.count + 1, EVENT_STORE_CAPACITY)
    store.nextId += 1
  }

  return batch.events.length
}

/** Most recent first. */
export function readRecent(limit: number): StoredEvent[] {
  const store = getStore()
  const out: StoredEvent[] = []
  const take = Math.min(limit, store.count)

  for (let i = 1; i <= take; i += 1) {
    const index = (store.head - i + EVENT_STORE_CAPACITY) % EVENT_STORE_CAPACITY
    const event = store.buf[index]
    if (event) out.push(event)
  }

  return out
}

export function storeSize(): number {
  return getStore().count
}
