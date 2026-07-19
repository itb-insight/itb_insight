import { MAX_BATCH, MAX_METADATA_KEYS, MAX_STRING_LENGTH } from "../config"
import { isDivisionTag, type DivisionTag } from "../divisions"
import type { DeviceInfo, DeviceType, EventMetadata, TrackedEvent } from "../types"

/**
 * The single PII chokepoint.
 *
 * The client-side EventMetadata type (flat, primitives only) is the first half
 * of the defence; this file is the half that does not trust the client at all.
 * Every event entering the store passes through here.
 */

/**
 * Metadata keys that must never be stored. `nim` and `nik` are Indonesian
 * student and national ID numbers — both are direct identifiers and both are
 * plausible things a well-meaning dev would attach to a registration event.
 */
const PII_KEY_PATTERN = /email|mail|name|phone|telp|hp|nim|nik|token|password|passwd|secret|address|alamat|birth|dob/i

const VALID_DEVICE_TYPES: DeviceType[] = ["desktop", "mobile", "tablet"]

function clampString(value: string): string {
  return value.slice(0, MAX_STRING_LENGTH)
}

/** Drops query strings — they routinely carry emails and tokens. */
function sanitizePath(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) return "/"
  const withoutQuery = value.split("?")[0].split("#")[0]
  return clampString(withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`)
}

function sanitizeMetadata(raw: unknown): EventMetadata {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {}

  const out: EventMetadata = {}
  let count = 0

  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (count >= MAX_METADATA_KEYS) break
    if (PII_KEY_PATTERN.test(key)) continue

    // Primitives only. A nested object or array is dropped outright rather
    // than serialized, because we cannot inspect what is inside it.
    if (typeof value === "string") {
      out[key] = clampString(value)
    } else if (typeof value === "number" && Number.isFinite(value)) {
      out[key] = value
    } else if (typeof value === "boolean" || value === null) {
      out[key] = value
    } else {
      continue
    }
    count += 1
  }

  return out
}

function sanitizeDevice(raw: unknown): DeviceInfo {
  const fallback: DeviceInfo = { deviceType: "desktop", browser: "Other", os: "Other" }
  if (typeof raw !== "object" || raw === null) return fallback

  const device = raw as Record<string, unknown>
  const deviceType =
    typeof device.deviceType === "string" && VALID_DEVICE_TYPES.includes(device.deviceType as DeviceType)
      ? (device.deviceType as DeviceType)
      : "desktop"

  return {
    deviceType,
    browser: typeof device.browser === "string" ? clampString(device.browser) : "Other",
    os: typeof device.os === "string" ? clampString(device.os) : "Other",
  }
}

export interface ValidatedBatch {
  sessionId: string
  device: DeviceInfo
  events: Array<TrackedEvent & { division: DivisionTag }>
}

export type ValidationResult =
  | { ok: true; batch: ValidatedBatch }
  | { ok: false; error: string }

export default function validateBatch(raw: unknown): ValidationResult {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "body must be an object" }
  }

  const body = raw as Record<string, unknown>

  if (typeof body.sessionId !== "string" || body.sessionId.length === 0) {
    return { ok: false, error: "sessionId is required" }
  }
  if (!Array.isArray(body.events)) {
    return { ok: false, error: "events must be an array" }
  }
  if (body.events.length === 0) {
    return { ok: false, error: "events must not be empty" }
  }
  if (body.events.length > MAX_BATCH) {
    return { ok: false, error: `batch exceeds ${MAX_BATCH} events` }
  }

  const events: ValidatedBatch["events"] = []

  for (const item of body.events) {
    if (typeof item !== "object" || item === null) continue
    const event = item as Record<string, unknown>

    if (typeof event.name !== "string" || event.name.length === 0) continue

    const division =
      typeof event.division === "string" && isDivisionTag(event.division) ? event.division : "MISC"

    events.push({
      name: clampString(event.name),
      division,
      pagePath: sanitizePath(event.pagePath),
      metadata: sanitizeMetadata(event.metadata),
      // Never trust a client clock for ordering; the store stamps arrival time.
      ts: typeof event.ts === "number" && Number.isFinite(event.ts) ? event.ts : Date.now(),
    })
  }

  if (events.length === 0) {
    return { ok: false, error: "no valid events in batch" }
  }

  return {
    ok: true,
    batch: {
      sessionId: clampString(body.sessionId),
      device: sanitizeDevice(body.device),
      events,
    },
  }
}
