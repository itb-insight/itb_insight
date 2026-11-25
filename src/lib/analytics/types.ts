import type { DivisionTag } from "./divisions"

/**
 * Event names are a loose union: the known set gets autocomplete and registry
 * lookups, but a new page can emit its own name without editing this file.
 * Unregistered names land in the MISC division.
 */
export type KnownEventName =
  | "page_view"
  | "section_impression"
  | "scroll_depth"
  | "web_vital"
  | "sponsor_impression"
  | "sponsor_click"
  | "reg_started"
  | "reg_completed"
  | "funnel_step_enter"
  | "funnel_step_complete"
  | "funnel_dropoff"
  | "qr_checkin"
  | "drone_ready"
  | "drone_context_lost"

export type EventName = KnownEventName | (string & {})

/**
 * Deliberately flat and primitive-only, NOT Record<string, unknown>. Nested
 * objects are the usual way PII sneaks into an events table, so passing one
 * fails to typecheck. PostHog would store them as-is, so this type is the guard.
 */
export type EventMetadata = Record<string, string | number | boolean | null>

/** Shape the client queues and sends. */
export interface TrackedEvent {
  name: EventName
  division: DivisionTag
  pagePath: string
  metadata: EventMetadata
  ts: number
  /** Send immediately with a beacon: the page is being hidden or closed. */
  urgent?: boolean
}
