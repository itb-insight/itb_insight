/** Tuning knobs for the tracking pipeline. Shared by client queue and server route. */

export const ENDPOINT = "/api/track"

/** How often the client drains its queue, in ms. */
export const FLUSH_INTERVAL_MS = 5000

/**
 * Batch caps. These are the real defence on a public write endpoint: a
 * batching client makes few requests, so an attacker's lever is batch size,
 * not request frequency.
 */
export const MAX_BATCH = 50
export const MAX_BODY_BYTES = 32 * 1024

/** sendBeacon caps around 64KB across browsers; stay well under. */
export const MAX_METADATA_KEYS = 20
export const MAX_STRING_LENGTH = 128

/**
 * 1-in-N sampling for high-volume passive signals. Clicks and conversions are
 * never listed here — they go through trackClick, which forces full fidelity.
 */
export const SAMPLE_RATES: Record<string, number> = {
  scroll_depth: 10,
  section_impression: 2,
}

/** Rate limiting, per process. See server/rateLimit.ts for the honest caveats. */
export const RATE_LIMIT_WINDOW_MS = 60_000
export const RATE_LIMIT_MAX_REQUESTS = 30

/** Ring buffer capacity for the Recent Events feed. */
export const EVENT_STORE_CAPACITY = 500
