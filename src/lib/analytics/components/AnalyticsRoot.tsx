"use client"

import { useEffect } from "react"
import { drainAbandoned } from "../funnelJournal"
import logEvent from "../logEvent"
import { startAnalytics } from "../queue"

/**
 * Mounted once in the root layout. Owns what must happen exactly once per app:
 *
 *   1. start loading PostHog (lazily, on idle). PostHog itself captures $pageview on every route
 *      change, $pageleave, and web vitals, so there is no page_view / web-vitals code here.
 *   2. funnel drop-off derivation on page hide
 *
 * Keeping this a leaf is what lets the root layout stay a server component.
 */
export default function AnalyticsRoot() {
  useEffect(() => {
    startAnalytics()
  }, [])

  useEffect(() => {
    function emitDropoffs() {
      const now = Date.now()
      const abandoned = drainAbandoned()

      for (const record of abandoned) {
        logEvent(
          "funnel_dropoff",
          {
            funnelId: record.funnelId,
            lastStep: record.step,
            lastStepIndex: record.stepIndex,
            dwellMs: now - record.enteredAt,
          },
          // urgent: the page is going away, so send with a beacon instead of the batch queue.
          { division: record.division, force: true, urgent: true },
        )
      }
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
