"use client"

import { useCallback, useEffect, useRef } from "react"
import type { DivisionTag } from "../divisions"
import { markCompleted, recordStep } from "../funnelJournal"
import logEvent from "../logEvent"
import { alreadySeen } from "../queue"
import type { EventMetadata } from "../types"

export interface UseFunnelStepOptions {
  /** Groups steps into one funnel, e.g. "hackathon-insight". */
  funnelId: string
  /** Human-readable step name, e.g. "reg_started". */
  step: string
  /** 0-based ordering. Drop-off compares the highest index reached. */
  stepIndex: number
  division?: DivisionTag
  /** Emit funnel_step_enter on mount. Default true. */
  autoEnter?: boolean
  metadata?: EventMetadata
}

export interface FunnelStepControls {
  /** Call when the visitor clears this step. Marks the funnel non-abandoned. */
  complete: (metadata?: EventMetadata) => void
  /** Call to record an explicit, known abandonment (e.g. a cancel button). */
  abandon: (reason?: string) => void
}

/**
 * Funnel step tracking with automatic drop-off detection.
 *
 *   const { complete } = useFunnelStep({
 *     funnelId: "hackathon-insight",
 *     step: "reg_started",
 *     stepIndex: 1,
 *     division: "CPT",
 *   })
 *
 * Why drop-off is reusable rather than hand-instrumented: this hook writes the
 * step into a sessionStorage journal, and a single listener in AnalyticsRoot
 * emits funnel_dropoff on page hide for any funnel that never reached its
 * terminal step. A new funnel needs no new listener and no new event type —
 * just a new funnelId. That is the "template-ish" requirement.
 */
export default function useFunnelStep(options: UseFunnelStepOptions): FunnelStepControls {
  const { funnelId, step, stepIndex, division = "CPT", autoEnter = true, metadata } = options

  // Latest-value ref so complete()/abandon() stay stable across renders.
  // Updated in an effect, never during render.
  const latest = useRef({ funnelId, step, stepIndex, division, metadata })

  useEffect(() => {
    latest.current = { funnelId, step, stepIndex, division, metadata }
  })

  useEffect(() => {
    if (!autoEnter) return

    recordStep({
      funnelId,
      step,
      stepIndex,
      division,
      enteredAt: Date.now(),
      completed: false,
    })

    // StrictMode guard — without it every dev-mode funnel entry counts twice.
    if (alreadySeen(`funnel_enter:${funnelId}:${step}`)) return

    logEvent(
      "funnel_step_enter",
      { funnelId, step, stepIndex, ...latest.current.metadata },
      { division, force: true },
    )
  }, [funnelId, step, stepIndex, division, autoEnter])

  const complete = useCallback((extra?: EventMetadata) => {
    const current = latest.current
    markCompleted(current.funnelId)

    logEvent(
      "funnel_step_complete",
      {
        funnelId: current.funnelId,
        step: current.step,
        stepIndex: current.stepIndex,
        ...current.metadata,
        ...extra,
      },
      { division: current.division, force: true },
    )
  }, [])

  const abandon = useCallback((reason?: string) => {
    const current = latest.current

    logEvent(
      "funnel_dropoff",
      {
        funnelId: current.funnelId,
        lastStep: current.step,
        lastStepIndex: current.stepIndex,
        reason: reason ?? "explicit",
      },
      { division: current.division, force: true },
    )
  }, [])

  return { complete, abandon }
}
