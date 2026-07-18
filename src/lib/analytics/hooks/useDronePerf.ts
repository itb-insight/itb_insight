"use client"

import { useCallback, useEffect, useRef } from "react"
import logEvent from "../logEvent"
import { alreadySeen } from "../queue"

export interface UseDronePerfOptions {
  componentId?: string
}

export interface DronePerfControls {
  /** Call from the first render loop iteration that has actually painted. */
  onFirstFrame: () => void
  onContextLost: () => void
}

/**
 * Load-performance instrumentation for WebGL components.
 *
 * IMPORTANT NAMING: this measures mount to first rendered frame and reports it
 * as drone_ready_ms. That is NOT time-to-interactive — real TTI is not
 * measurable from userland, and calling it TTI would misrepresent the number
 * on the dashboard. Genuine LCP/INP/TTFB come from useReportWebVitals in
 * AnalyticsRoot instead.
 *
 * The 3D flythrough is the heaviest thing on the site and WebGL performance
 * varies wildly on low-end phones, so this is the signal that distinguishes
 * "visitors were not interested" from "it never finished loading".
 */
export default function useDronePerf(options: UseDronePerfOptions = {}): DronePerfControls {
  const { componentId = "drone-cube" } = options

  // Stamped in a mount effect, not in the useRef initializer — performance.now()
  // is impure and must not run during render. This hook is called before the
  // consuming component's own effects, so the stamp lands before first paint.
  const mountedAt = useRef<number>(0)

  useEffect(() => {
    mountedAt.current = performance.now()
  }, [])

  const onFirstFrame = useCallback(() => {
    // Only the first frame counts, and the StrictMode guard keeps dev honest.
    if (alreadySeen(`drone_ready:${componentId}`)) return

    logEvent(
      "drone_ready",
      {
        componentId,
        readyMs: Math.round(performance.now() - mountedAt.current),
      },
      { force: true },
    )
  }, [componentId])

  const onContextLost = useCallback(() => {
    logEvent("drone_context_lost", { componentId }, { force: true })
  }, [componentId])

  return { onFirstFrame, onContextLost }
}
