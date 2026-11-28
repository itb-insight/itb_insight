// Untrusted JSON body fields -> trimmed strings with a length cap. Use it instead of calling
// `.trim()` on `request.json()` values: a number or object there throws (500), and nothing
// limits the length otherwise.

export type TextFields<K extends string> =
  | { ok: true; values: Partial<Record<K, string>> }
  | { ok: false; field: K }

/**
 * Reads `spec` keys from `body`. Missing, null and blank values come back undefined; a present
 * value that is not a string, or is longer than its limit after trimming, fails with its name.
 */
export function parseTextFields<K extends string>(body: unknown, spec: Record<K, number>): TextFields<K> {
  const source = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  const values: Partial<Record<K, string>> = {}

  for (const field of Object.keys(spec) as K[]) {
    const raw = source[field]
    if (raw === undefined || raw === null) continue
    if (typeof raw !== 'string') return { ok: false, field }
    const value = raw.trim()
    if (value.length > spec[field]) return { ok: false, field }
    if (value) values[field] = value
  }

  return { ok: true, values }
}

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Limits shared with the profiles_field_lengths constraint (migration 0023_security_hardening). */
export const PROFILE_LIMITS = { name: 120, phoneNumber: 32, institution: 200 } as const

/** How far back an offline-queued capture time may go (a whole event day). */
export const MAX_CAPTURE_AGE_MS = 12 * 60 * 60 * 1000

/**
 * The time a staff phone captured a scan while offline (ISO 8601 from the body), for routes that
 * accept queued scans. Undefined when absent. A time in the future is clamped to `now` (phone
 * clocks drift); one older than MAX_CAPTURE_AGE_MS, or unparseable, is invalid. The database
 * still decides whether the time is inside the game window.
 */
export function parseCapturedAt(
  raw: string | undefined,
  now = Date.now(),
): { ok: true; value: string | undefined } | { ok: false } {
  if (raw === undefined) return { ok: true, value: undefined }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:\d{2})$/.test(raw)) return { ok: false }
  const time = Date.parse(raw)
  if (!Number.isFinite(time) || now - time > MAX_CAPTURE_AGE_MS) return { ok: false }
  return { ok: true, value: new Date(Math.min(time, now)).toISOString() }
}
