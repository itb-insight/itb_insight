"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

import { flushEvents, trackEvent } from "@/lib/analytics/queue"

const FLUSH_INTERVAL_MS = 15_000

// Mounted once in the root layout. Records a `page_view` on every route change and drives the
// periodic + page-hide flushes. All the batching lives in the queue; this is just the wiring.
export default function AnalyticsProvider() {
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)

  // Track page views on navigation.
  useEffect(() => {
    if (pathname && pathname !== lastPath.current) {
      lastPath.current = pathname
      trackEvent("page_view", pathname)
    }
  }, [pathname])

  // Periodic flush + flush when the tab is hidden or the page is unloaded.
  useEffect(() => {
    const interval = setInterval(() => void flushEvents(), FLUSH_INTERVAL_MS)

    const handleHide = () => {
      if (document.visibilityState === "hidden") {
        void flushEvents({ keepalive: true })
      }
    }

    document.addEventListener("visibilitychange", handleHide)
    window.addEventListener("pagehide", () => void flushEvents({ keepalive: true }))

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", handleHide)
    }
  }, [])

  return null
}
