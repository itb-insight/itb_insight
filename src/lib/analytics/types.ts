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
 * fails to typecheck. The server re-validates anyway — see server/validate.ts.
 */
export type EventMetadata = Record<string, string | number | boolean | null>

export type DeviceType = "desktop" | "mobile" | "tablet"

export interface DeviceInfo {
  deviceType: DeviceType
  browser: string
  os: string
}

/** Shape the client queues and sends. */
export interface TrackedEvent {
  name: EventName
  division: DivisionTag
  pagePath: string
  metadata: EventMetadata
  ts: number
}

export interface TrackBatch {
  sessionId: string
  device: DeviceInfo
  events: TrackedEvent[]
}

/** Shape the server stores — mirrors the `events` table columns in schema.sql. */
export interface StoredEvent {
  id: number
  session_id: string
  user_id: null
  event_type: string
  division: DivisionTag
  page_path: string
  metadata: EventMetadata
  device_type: DeviceType
  browser: string
  os: string
  created_at: string
}
