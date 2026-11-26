/** Tuning knobs for the client tracking library. */

/**
 * 1-in-N sampling for high-volume passive signals. Clicks and conversions are
 * never listed here — they go through trackClick, which forces full fidelity.
 * /admin scales these back up (sampleWeight() in src/features/admin/data/adapters.ts).
 */
export const SAMPLE_RATES: Record<string, number> = {
  scroll_depth: 10,
  section_impression: 2,
}
