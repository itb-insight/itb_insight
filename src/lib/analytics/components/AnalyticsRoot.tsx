"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useReportWebVitals } from "next/web-vitals"
import { drainAbandoned } from "../funnelJournal"
import logEvent from "../logEvent"
import { alreadySeen, flush } from "../queue"

/**
 * Mounted once in the root layout. Owns the three things that must happen
 * exactly once per app rather than once per component:
 *
 *   1. page_view on every route change
 *   2. web vitals reporting
 *   3. funnel drop-off derivation on page hide
 *
 * Keeping useReportWebVitals confined here is what lets the root layout stay a
 * server component — only this leaf needs "use client".
 */
export default function AnalyticsRoot() {
  const pathname = usePathname()

  useReportWebVitals((metric) => {
    logEvent(
      "web_vital",
      {
        metric: metric.name,
        value: Math.round(metric.value),
        rating: metric.rating ?? null,
      },
      { force: true },
    )
  })

  useEffect(() => {
    // StrictMode double-invokes effects in dev; without this guard every
    // page_view count reads 2x locally.
    if (alreadySeen(`page_view:${pathname}`)) return
    logEvent("page_view", { path: pathname }, { force: true })
  }, [pathname])

  useEffect(() => {
    function emitDropoffs() {
      const now = Date.now()
      const abandoned = drainAbandoned()
      if (abandoned.length === 0) return

      for (const record of abandoned) {
        logEvent(
          "funnel_dropoff",
          {
            funnelId: record.funnelId,
            lastStep: record.step,
            lastStepIndex: record.stepIndex,
            dwellMs: now - record.enteredAt,
          },
          { division: record.division, force: true },
        )
      }

      // Flush explicitly. The queue registers its own visibilitychange
      // listener when the first event is enqueued, which is always before this
      // effect runs — so by the time we get here the queue has already
      // flushed for this hide, and these drop-offs would otherwise sit in the
      // buffer and be lost when the page goes away.
      flush()
    }

    function handleVisibility() {
      if (document.visibilityState === "hidden") emitDropoffs()
    }

    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener("pagehide", emitDropoffs)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("pagehide", emitDropoffs)
    }
  }, [])

  return null
}
