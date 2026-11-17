schema_version: 2

# Security checklist

## Current controls and gaps

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only; do not expose it in browser code, `NEXT_PUBLIC_*`, docs, logs, or evidence.
- `/dashboard*` and `/admin*` require a session (proxy). `/admin*` also requires the admin role (`src/app/admin/layout.tsx`); every admin API checks the role with `getScopedUser`.
- Admin role: `admin_roles`, `profiles.role_a = 'admin'`, or a *confirmed* email in `ADMIN_EMAILS`.
- Guardrail tests (`tests/guardrails/`) enforce API auth, RLS, server-only secrets, filter escaping and secret scanning in CI.
- QR ticket values must remain opaque; use `visitor_tickets`, not legacy `rsvp`.
- The analytics endpoint is public, rate-limited per process, and volatile; it must not be used as an authoritative store.

## Required before expanding operations

- Apply final PRD SEC-01–SEC-13: TLS/at-rest protection, secure auth/rate limiting, scoped RBAC, audit logging, private short-lived signed uploads, 60-day identity-document deletion, CSRF/XSS/IDOR controls, WAF/bot protection, consent, and no card data.
- Server-authorize every operational admin page/API and test unauthenticated/non-admin denial; record sensitive access and exports.
- For payments, implement server-side amount/transaction creation, verified idempotent webhooks, retries/reconciliation, and refund policy before accepting payment state.
- Reassess RLS and route authorization whenever a new mutation or data export is added.
