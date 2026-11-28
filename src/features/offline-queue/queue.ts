/*
  Offline scan queue (PWA, docs/OFFLINE.md): what staff scanners store on the phone while the
  signal is gone, and how each answer from the server is handled when the entry is sent again.
  Pure logic, no browser APIs: storage is store.ts, the React side useOfflineQueue.ts.

  An entry is sent to its kind's endpoint with the same body every time. Booth awards carry a
  clientRef (the database writes it once, arcade_award_booth); a gate check-in happens once per
  ticket. So sending an entry twice never counts twice.
*/

export type QueueKind = "booth" | "gate"

export const QUEUE_ENDPOINTS: Record<QueueKind, string> = {
  booth: "/api/booth-points/scan",
  gate: "/api/gate/scan",
}

export type QueueStatus = "pending" | "failed"

export type QueueEntry = {
  /** The booth award's clientRef; a random id for gate scans. */
  id: string
  kind: QueueKind
  /** The account that scanned: only that account sends it. */
  staffUserId: string
  /** One entry per award: kind:qr:booth:option (see dedupeKey). */
  dedupeKey: string
  /** Sent as-is, including capturedAt. */
  body: Record<string, unknown>
  /** Server-corrected time of the scan (ISO). */
  capturedAt: string
  /** Shown in the queue list, e.g. "QR …a1b2 · Visited · Booth X". */
  label: string
  attempts: number
  status: QueueStatus
  /** Why the server refused it (status "failed"). */
  error?: { code: string | null; message: string }
}

export function dedupeKey(kind: QueueKind, qrCode: string, boothId = "", option = ""): string {
  return `${kind}:${qrCode}:${boothId}:${option}`
}

/** Last characters of the QR token, to tell queued visitors apart without a name. */
export function qrTail(qrCode: string): string {
  return qrCode.slice(-4)
}

/** What happened when an entry was sent. */
export type SendResult =
  | { type: "network" }
  | { type: "auth" }
  | { type: "response"; status: number; success: boolean; code: string | null }

/**
 * done:   written (or already written: duplicate), remove it.
 * retry:  not decided yet (no signal, server error, paused, session to refresh), keep it pending.
 * failed: the server refused it for good (already given, closed, unknown QR...), show it to staff.
 */
export type Outcome = "done" | "retry" | "failed"

const RETRY_CODES = new Set(["PAUSED", "DATABASE_ERROR", "SERVER_ERROR", "REPRESENTED_NOT_SAVED", "UNAUTHORIZED"])

export function classifyResult(result: SendResult): Outcome {
  if (result.type !== "response") return "retry"
  if (result.success) return "done"
  if (result.code && RETRY_CODES.has(result.code)) return "retry"
  if (result.status >= 500 || result.status === 401 || result.status === 408 || result.status === 423 || result.status === 429) {
    return "retry"
  }
  return "failed"
}

/** Pending entries of this account, oldest scan first. */
export function sendOrder(entries: readonly QueueEntry[], staffUserId: string): QueueEntry[] {
  return entries
    .filter((entry) => entry.status === "pending" && entry.staffUserId === staffUserId)
    .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt))
}

/**
 * The phone clock's offset from the server, from a response's Date header (whole seconds, so
 * +500 ms on average) and the request's start and end on the phone.
 */
export function clockSkew(serverDate: number, startedAt: number, endedAt: number): number {
  return Math.round(serverDate + 500 - (startedAt + endedAt) / 2)
}
