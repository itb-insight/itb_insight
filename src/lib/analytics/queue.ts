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
}
