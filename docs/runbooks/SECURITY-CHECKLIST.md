schema_version: 2

# Security checklist

## Current controls and gaps

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only; do not expose it in browser code, `NEXT_PUBLIC_*`, docs, logs, or evidence.
- `/dashboard*` is protected by current session middleware. `/admin*` is **not** protected and is public/demo/mock state.
- The existing admin helper checks `admin_roles` then `ADMIN_EMAILS`, but it is not wired to current admin pages/events.
- QR ticket values must remain opaque; use `visitor_tickets`, not legacy `rsvp`.
- The analytics endpoint is public, rate-limited per process, and volatile; it must not be used as an authoritative store.

## Required before expanding operations

- Apply final PRD SEC-01–SEC-13: TLS/at-rest protection, secure auth/rate limiting, scoped RBAC, audit logging, private short-lived signed uploads, 60-day identity-document deletion, CSRF/XSS/IDOR controls, WAF/bot protection, consent, and no card data.
- Server-authorize every operational admin page/API and test unauthenticated/non-admin denial; record sensitive access and exports.
- For payments, implement server-side amount/transaction creation, verified idempotent webhooks, retries/reconciliation, and refund policy before accepting payment state.
- Reassess RLS and route authorization whenever a new mutation or data export is added.
