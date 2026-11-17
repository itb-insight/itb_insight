// Personal visitor QR payload. Client-safe (no node imports): rendered in the browser,
// parsed again by the gate / booth scan endpoints.
//
// The QR carries the visitor's `visitor_tickets.qr_code` token — never the raw profile uuid.
// The token maps 1:1 to the profile through `visitor_tickets.user_id`, is unguessable, and can
// be revoked by rotating the row. The prefix lets scanners reject unrelated QRs and lets us
// change the format later (bump to v2).

export const VISITOR_QR_PREFIX = 'itbi:v1:'

// New tokens are 22 chars (16 random bytes, base64url); legacy ones are 64 hex chars.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,128}$/

export function encodeVisitorQr(token: string): string {
  return `${VISITOR_QR_PREFIX}${token}`
}

// Returns the ticket token, or null when the scanned value is not a visitor QR.
// A bare token (no prefix) is accepted too, for manual-lookup flows that pass `qr_code` directly.
export function parseVisitorQr(raw: unknown): string | null {
  if (typeof raw !== 'string') return null

  const value = raw.trim()
  const token = value.startsWith(VISITOR_QR_PREFIX) ? value.slice(VISITOR_QR_PREFIX.length) : value

  return TOKEN_PATTERN.test(token) ? token : null
}
