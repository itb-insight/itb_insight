import type { DivisionTag } from "./divisions"
import logEvent from "./logEvent"
import type { EventMetadata, EventName } from "./types"

/**
 * Click tracking with full fidelity baked in.
 *
 *   onClick={() => trackClick("sponsor_click", { sponsorId, tier })}
 *
 * This exists so no call site has to remember that clicks and conversions must
 * never be sampled — forgetting `force: true` on a logEvent call would quietly
 * undercount conversions by the sampling rate, which is the kind of bug you
 * only notice a month later.
 */
export default function trackClick(
  name: EventName,
  metadata: EventMetadata = {},
  options: { division?: DivisionTag } = {},
): void {
  logEvent(name, metadata, { ...options, force: true })
}
