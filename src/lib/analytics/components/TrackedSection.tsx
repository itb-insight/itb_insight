"use client"

import type { DivisionTag } from "../divisions"
import useImpression from "../hooks/useImpression"
import useScrollDepth from "../hooks/useScrollDepth"
import type { EventMetadata, EventName } from "../types"

interface TrackedSectionProps {
  sectionId: string
  division?: DivisionTag
  eventName?: EventName
  threshold?: number
  minVisibleMs?: number
  /** Also track page scroll depth while this section is mounted. */
  scrollDepth?: boolean
  metadata?: EventMetadata
  as?: "section" | "div" | "article"
  className?: string
  children: React.ReactNode
}

/**
 * Drop-in impression tracking for any section, with no hook knowledge needed.
 *
 *   <TrackedSection sectionId="sponsors" division="SP">…</TrackedSection>
 *
 * Both mechanisms are available as hook AND component on purpose: this is the
 * on-ramp for a page author who just wants numbers, useImpression is the
 * escape hatch when you need the ref on an element you already control.
 */
export default function TrackedSection({
  sectionId,
  division,
  eventName,
  threshold,
  minVisibleMs,
  scrollDepth = false,
  metadata,
  as: Tag = "section",
  className,
  children,
}: TrackedSectionProps) {
  const ref = useImpression({ sectionId, division, eventName, threshold, minVisibleMs, metadata })

  // Hooks cannot be called conditionally, so the flag is passed down as an
  // empty threshold list rather than skipping the call.
  useScrollDepth({
    sectionId,
    division,
    thresholds: scrollDepth ? [25, 50, 75, 100] : [],
  })

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}
