import { resolveDivision, type DivisionTag } from "./divisions"
import { enqueue } from "./queue"
import shouldSample from "./sampling"
import type { EventMetadata, EventName } from "./types"

interface LogEventOptions {
  /** Overrides the EVENT_DIVISION registry lookup for this one call. */
  division?: DivisionTag
  /** Bypasses sampling. Use for clicks and conversions — see trackClick. */
  force?: boolean
}

/**
 * The one tracking primitive. Build once, use everywhere.
 *
 *   logEvent("sponsor_click", { sponsorId: "telkom", tier: "platinum" })
 *   logEvent("scroll_depth", { depth: 50 })
 *
 * Fire-and-forget: returns void, never throws, and no-ops during server
 * rendering so it is safe to call from anywhere without a guard.
 */
export default function logEvent(
  name: EventName,
  metadata: EventMetadata = {},
  options: LogEventOptions = {},
): void {
  if (typeof window === "undefined") return

  try {
    if (!options.force && !shouldSample(name)) return

    enqueue({
      name,
      division: resolveDivision(name, options.division),
      pagePath: window.location.pathname,
      metadata,
      ts: Date.now(),
    })
  } catch {
    // Analytics must never break a page render or a click handler.
  }
}
