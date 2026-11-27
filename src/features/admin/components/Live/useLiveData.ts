"use client"

import { useEffect, useState } from "react"

import type { DDayDto, LiveDto } from "../../data/types"

const POLL_MS = 30_000

type Envelope<T> = { success: true; data: T } | { success: false }

/**
 * Starts from the server-rendered figures, then polls `url` every 30 s while the tab is visible
 * (the server caches for 30 s too, so polling faster would gain nothing). A tab coming back into
 * view refreshes at once if its figures are older than that.
 */
export function usePolledData<T>(url: string, initial: T) {
  const [data, setData] = useState(initial)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let lastLoad = Date.now()

    const load = async () => {
      if (document.visibilityState === "hidden") return
      lastLoad = Date.now()
      try {
        const res = await fetch(url, { cache: "no-store" })
        const json = (await res.json()) as Envelope<T>
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
  }, [url])

  return { data, failed }
}

/** /admin live panels: GET /api/admin/live. */
export const useLiveData = (initial: LiveDto) => usePolledData("/api/admin/live", initial)

/** /admin/d-day: GET /api/admin/d-day. */
export const useDDayData = (initial: DDayDto) => usePolledData("/api/admin/d-day", initial)
