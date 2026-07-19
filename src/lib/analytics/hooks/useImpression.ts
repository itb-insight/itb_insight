"use client"

import { useCallback, useEffect, useRef } from "react"
import type { DivisionTag } from "../divisions"
import logEvent from "../logEvent"
import { alreadySeen } from "../queue"
import type { EventMetadata, EventName } from "../types"

export interface UseImpressionOptions {
  /** Stable identifier for the tracked section. Also the dedupe key. */
  sectionId: string
  division?: DivisionTag
  /** Defaults to "section_impression"; pass "sponsor_impression" for sponsors. */
  eventName?: EventName
  /** Visible fraction required to count. Default 0.5. */
  threshold?: number
  /** Dwell time before it counts, in ms. Default 0 (count immediately). */
  minVisibleMs?: number
  /** Count at most once per session. Default true. */
  once?: boolean
  metadata?: EventMetadata
}

/**
 * Impression tracking via IntersectionObserver — the clicks/impressions
 * template, half of it anyway (see trackClick for the other half).
 *
 *   <section ref={useImpression({ sectionId: "sponsors-gold", division: "SP" })}>
 *
 * Returns a REF CALLBACK, not a ref object. That matters: it composes onto any
 * element with no ceremony, survives conditional remounts, and unobserves
 * deterministically when the node detaches.
 */
export default function useImpression(options: UseImpressionOptions) {
  const {
    sectionId,
    division,
    eventName = "section_impression",
    threshold = 0.5,
    minVisibleMs = 0,
    once = true,
    metadata,
  } = options

  const observerRef = useRef<IntersectionObserver | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Held in a ref so a new metadata object literal on every render does not
  // tear down and re-create the observer. Updated in an effect rather than
  // during render — the initial value already covers the first mount, since
  // ref callbacks run before effects.
  const latest = useRef({ eventName, division, metadata, sectionId, once, minVisibleMs })

  useEffect(() => {
    latest.current = { eventName, division, metadata, sectionId, once, minVisibleMs }
  })

  return useCallback(
    (node: Element | null) => {
      observerRef.current?.disconnect()
      observerRef.current = null
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }

      if (!node || typeof IntersectionObserver === "undefined") return

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const current = latest.current

            if (!entry.isIntersecting) {
              // Left the viewport before satisfying the dwell gate.
              if (timerRef.current) {
                clearTimeout(timerRef.current)
                timerRef.current = null
              }
              continue
            }

            const fire = () => {
              const key = `impression:${current.sectionId}`
              // Guards both the once-per-session rule and React StrictMode's
              // double effect invocation in development.
              if (current.once && alreadySeen(key)) return

              logEvent(
                current.eventName,
                { sectionId: current.sectionId, ...current.metadata },
                { division: current.division },
              )

              if (current.once) observer.disconnect()
            }

            if (current.minVisibleMs > 0) {
              timerRef.current = setTimeout(fire, current.minVisibleMs)
            } else {
              fire()
            }
          }
        },
        { threshold },
      )

      observer.observe(node)
      observerRef.current = observer
    },
    [threshold],
  )
}
