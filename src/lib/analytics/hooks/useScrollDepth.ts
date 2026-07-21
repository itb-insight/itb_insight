"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import type { DivisionTag } from "../divisions"
import logEvent from "../logEvent"

export interface UseScrollDepthOptions {
  /** Defaults to the current pathname. */
  sectionId?: string
  /** Percentages that fire an event once each. Default [25, 50, 75, 100]. */
  thresholds?: number[]
  division?: DivisionTag
}

/**
 * Scroll-depth tracking — how far down the page people actually get.
 *
 *   useScrollDepth({ division: "CB" })
 *
 * Fires once per threshold per page view. This is the highest-volume event in
 * the system, so it is rAF-throttled here and sampled 1-in-10 in the queue.
 * Dashboards reading scroll_depth must scale by the sample rate.
 */
export default function useScrollDepth(options: UseScrollDepthOptions = {}) {
  const { sectionId, thresholds = [25, 50, 75, 100], division } = options
  const pathname = usePathname()
  const firedRef = useRef<Set<number>>(new Set())

  const key = sectionId ?? pathname
  // Depend on the contents, not the array identity: the default literal is a
  // new object every render, which would otherwise reset the fired-set and
  // re-emit every threshold on each re-render.
  const thresholdKey = thresholds.join(",")

  useEffect(() => {
    // No thresholds means the caller opted out — attach nothing at all.
    if (thresholdKey.length === 0) return

    firedRef.current = new Set()
    let frame = 0

    function measure() {
      frame = 0

      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      // A page shorter than the viewport has no meaningful depth to report.
      if (scrollable <= 0) return

      const percent = Math.min(100, Math.round((window.scrollY / scrollable) * 100))

      for (const threshold of thresholdKey.split(",").map(Number)) {
        if (percent >= threshold && !firedRef.current.has(threshold)) {
          firedRef.current.add(threshold)
          logEvent("scroll_depth", { sectionId: key, depth: threshold }, { division })
        }
      }
    }

    function onScroll() {
      // rAF throttle: scroll fires far faster than we could usefully sample.
      if (frame) return
      frame = requestAnimationFrame(measure)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    measure()

    return () => {
      window.removeEventListener("scroll", onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [key, division, thresholdKey])
}
