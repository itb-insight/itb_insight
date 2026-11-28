"use client"

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"

import { classifyResult, sendOrder, type QueueEntry, type QueueKind } from "./queue"
import { getReachable, getReachableOnServer, sendScan, serverNowIso, subscribeReachable } from "./send"
import { deleteEntry, listEntries, putEntry } from "./store"

/*
  The staff phone's offline scan queue (docs/OFFLINE.md). Scans that could not reach the server are
  stored (store.ts) and sent again, oldest first:
    - as soon as the browser reports it is back online,
    - when the page becomes visible again,
    - every 10 seconds while anything is waiting (navigator.onLine is often wrong on weak signal),
    - right after a new entry is queued.
  One tab sends at a time (Web Locks when available). Entries saved by another account wait for
  that account. Results: queue.ts classifyResult.
*/

const RETRY_EVERY_MS = 10_000
const CHANNEL = "itbi-offline-queue"

export type Problem = "network" | "auth" | "paused" | null

export type NewEntry = {
  kind: QueueKind
  dedupeKey: string
  label: string
  body: Record<string, unknown>
  /** Reuse an id (a booth award's clientRef) so a request that did arrive is not counted twice. */
  id?: string
  capturedAt?: string
}

function subscribeOnline(listener: () => void): () => void {
  window.addEventListener("online", listener)
  window.addEventListener("offline", listener)
  return () => {
    window.removeEventListener("online", listener)
    window.removeEventListener("offline", listener)
  }
}
const getOnline = () => navigator.onLine
const getOnlineOnServer = () => true

function randomId(): string {
  const webCrypto = globalThis.crypto
  if (typeof webCrypto.randomUUID === "function") return webCrypto.randomUUID()
  const bytes = webCrypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function useOfflineQueue(
  staffUserId: string,
  options: { onSent?: (entry: QueueEntry, data: unknown) => void } = {},
) {
  const [entries, setEntries] = useState<QueueEntry[]>([])
  const [syncing, setSyncing] = useState(false)
  const [problem, setProblem] = useState<Problem>(null)
  const reachable = useSyncExternalStore(subscribeReachable, getReachable, getReachableOnServer)
  const browserOnline = useSyncExternalStore(subscribeOnline, getOnline, getOnlineOnServer)
  const flushing = useRef(false)
  const onSent = useRef(options.onSent)
  useEffect(() => {
    onSent.current = options.onSent
  })

  const channel = useRef<BroadcastChannel | null>(null)

  const reload = useCallback(async () => {
    setEntries(await listEntries())
  }, [])

  const changed = useCallback(async () => {
    await reload()
    channel.current?.postMessage("changed")
  }, [reload])

  const flushOnce = useCallback(async () => {
    const queue = sendOrder(await listEntries(), staffUserId)
    if (queue.length === 0) {
      setProblem(null)
      return
    }
    setSyncing(true)
    try {
      for (const entry of queue) {
        const sent = await sendScan(entry.kind, entry.body)
        const outcome = classifyResult(sent.result)
        if (outcome === "done") {
          await deleteEntry(entry.id)
          onSent.current?.(entry, sent.payload?.success ? sent.payload.data : null)
          setProblem(null)
        } else if (outcome === "failed") {
          await putEntry({
            ...entry,
            attempts: entry.attempts + 1,
            status: "failed",
            error: {
              code: sent.result.type === "response" ? sent.result.code : null,
              message: sent.payload && !sent.payload.success ? sent.payload.error.message : "Ditolak server.",
            },
          })
        } else {
          await putEntry({ ...entry, attempts: entry.attempts + 1 })
          setProblem(
            sent.result.type === "auth"
              ? "auth"
              : sent.result.type === "response" && sent.result.code === "PAUSED"
                ? "paused"
                : "network",
          )
          // The rest would fail the same way: wait for the next trigger.
          break
        }
        await changed()
      }
    } finally {
      setSyncing(false)
      await changed()
    }
  }, [staffUserId, changed])

  const flushNow = useCallback(async () => {
    if (flushing.current) return
    flushing.current = true
    try {
      const locks = typeof navigator !== "undefined" ? navigator.locks : undefined
      if (locks?.request) {
        await locks.request("itbi-offline-flush", { ifAvailable: true }, async (lock) => {
          if (lock) await flushOnce()
        })
      } else {
        await flushOnce()
      }
    } finally {
      flushing.current = false
    }
  }, [flushOnce])

  // Load, listen to other tabs, and send on the triggers above.
  useEffect(() => {
    // Deferred so the first state update happens after mount.
    const first = setTimeout(() => {
      void reload().then(() => flushNow())
    }, 0)
    if (typeof BroadcastChannel !== "undefined") {
      channel.current = new BroadcastChannel(CHANNEL)
      channel.current.onmessage = () => void reload()
    }
    const onOnline = () => void flushNow()
    const onVisible = () => {
      if (document.visibilityState === "visible") void flushNow()
    }
    window.addEventListener("online", onOnline)
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearTimeout(first)
      channel.current?.close()
      channel.current = null
      window.removeEventListener("online", onOnline)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [reload, flushNow])

  const own = entries.filter((entry) => entry.staffUserId === staffUserId)
  const pending = own.filter((entry) => entry.status === "pending").sort((a, b) => a.capturedAt.localeCompare(b.capturedAt))
  const failed = own.filter((entry) => entry.status === "failed")
  const otherAccountPending = entries.filter((entry) => entry.staffUserId !== staffUserId && entry.status === "pending").length

  useEffect(() => {
    if (pending.length === 0) return
    const timer = setInterval(() => void flushNow(), RETRY_EVERY_MS)
    return () => clearInterval(timer)
  }, [pending.length, flushNow])

  /** Stores a scan for later. Returns false when the same award is already waiting. */
  const enqueue = useCallback(
    async (entry: NewEntry): Promise<boolean> => {
      const existing = (await listEntries()).find(
        (item) => item.dedupeKey === entry.dedupeKey && item.staffUserId === staffUserId && item.status === "pending",
      )
      if (existing) return false
      const capturedAt = entry.capturedAt ?? serverNowIso()
      await putEntry({
        id: entry.id ?? randomId(),
        kind: entry.kind,
        staffUserId,
        dedupeKey: entry.dedupeKey,
        label: entry.label,
        body: { ...entry.body, capturedAt },
        capturedAt,
        attempts: 0,
        status: "pending",
      })
      await changed()
      // Try at once: the signal may already be back.
      setTimeout(() => void flushNow(), 1500)
      return true
    },
    [staffUserId, changed, flushNow],
  )

  const dismiss = useCallback(
    async (id: string) => {
      await deleteEntry(id)
      await changed()
    },
    [changed],
  )

  return {
    pending,
    failed,
    otherAccountPending,
    syncing,
    problem,
    /** False when the browser is offline or the last request could not reach the server. */
    online: browserOnline && reachable,
    enqueue,
    flushNow,
    dismiss,
  }
}
