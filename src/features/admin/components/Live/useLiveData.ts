"use client"

import { useEffect, useState } from "react"

import type { LiveDto } from "../../data/types"

const POLL_MS = 30_000

type Envelope = { success: true; data: LiveDto } | { success: false }

/**
 * Starts from the server-rendered figures, then polls /api/admin/live every 30 s while the tab is
 * visible (the server caches for 30 s too, so polling faster would gain nothing). A tab coming
 * back into view refreshes at once if its figures are older than that.
 */
export function useLiveData(initial: LiveDto) {
  const [data, setData] = useState(initial)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let lastLoad = Date.now()

    const load = async () => {
      if (document.visibilityState === "hidden") return
      lastLoad = Date.now()
      try {
        const res = await fetch("/api/admin/live", { cache: "no-store" })
        const json = (await res.json()) as Envelope
        if (cancelled) return
        if (json.success) setData(json.data)
        setFailed(!json.success)
      } catch {
        if (!cancelled) setFailed(true)
      }
    }

    const timer = setInterval(load, POLL_MS)
    const onVisibility = () => {
      if (document.visibilityState === "visible" && Date.now() - lastLoad >= POLL_MS) load()
    }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      cancelled = true
      clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  return { data, failed }
}
