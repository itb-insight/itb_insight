/*
  Sending a staff scan (booth award, gate check-in), shared by the scanners' live requests and the
  offline queue. Adds a timeout, learns the phone's clock offset from the server's Date header (so
  queued scans carry server time) and tracks whether the server is reachable, because
  navigator.onLine stays true on a connected-but-dead network.
*/

import { type ApiEnvelope, postWithAuth } from "@/features/dashboard/apiClient"

import { clockSkew, QUEUE_ENDPOINTS, type QueueKind, type SendResult } from "./queue"

const SKEW_KEY = "itbi-clock-skew"
const TIMEOUT_MS = 10_000

let skew: number | null = null

function readSkew(): number {
  if (skew !== null) return skew
  try {
    const stored = Number(localStorage.getItem(SKEW_KEY))
    skew = Number.isFinite(stored) ? stored : 0
  } catch {
    skew = 0
  }
  return skew
}

/** Now, by the server's clock as far as the phone knows it (ISO). */
export function serverNowIso(): string {
  return new Date(Date.now() + readSkew()).toISOString()
}

// Reachability ------------------------------------------------------------------------------------

let reachable = true
const listeners = new Set<() => void>()

function setReachable(value: boolean) {
  if (value === reachable) return
  reachable = value
  for (const listener of listeners) listener()
}

/** For useSyncExternalStore: false after a request failed for lack of network, until one succeeds. */
export function subscribeReachable(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
export const getReachable = () => reachable
export const getReachableOnServer = () => true

// Sending ------------------------------------------------------------------------------------------

export type Sent<T> = { result: SendResult; payload: ApiEnvelope<T> | null }

export async function sendScan<T>(kind: QueueKind, body: Record<string, unknown>): Promise<Sent<T>> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const startedAt = Date.now()
  try {
    const res = await postWithAuth<T>(QUEUE_ENDPOINTS[kind], body, { signal: controller.signal })
    if (res.needsAuth) {
      // No session token: offline, a refresh can't happen yet; online, the session really ended.
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setReachable(false)
        return { result: { type: "network" }, payload: null }
      }
      return { result: { type: "auth" }, payload: null }
    }
    setReachable(true)
    if (res.serverDate !== null) {
      skew = clockSkew(res.serverDate, startedAt, Date.now())
      try {
        localStorage.setItem(SKEW_KEY, String(skew))
      } catch {
        // Kept in memory.
      }
    }
    return {
      result: {
        type: "response",
        status: res.status,
        success: res.payload.success,
        code: res.payload.success ? null : res.payload.error.code,
      },
      payload: res.payload,
    }
  } catch {
    // Fetch failed, timed out, or the answer was not JSON (a proxy or gateway page).
    setReachable(false)
    return { result: { type: "network" }, payload: null }
  } finally {
    clearTimeout(timer)
  }
}
