# MVP status

**Current implementation only**, source-verified 2026-08-19. Final requirements are in [PRD(v1.0).md](PRD(v1.0).md).

## Implemented today

| Area | Current behavior |
| --- | --- |
| Runtime | Next.js 16.2.10, React 19.2.4, Supabase, MapLibre, Three.js, Framer Motion, and Lottie. |
| Auth | Google OAuth is implemented. `/dashboard*` redirects unauthenticated users to `/login?next=…`. |
| Registration | Individual/team APIs, final team submission lock, `submitted`/`verified`/`rejected` statuses. |
| Tickets | Authenticated ticket ensure uses `visitor_tickets`. |
| Schema | Migrations `0001`–`0006`, including payment and analytics tables. |
| Analytics | `/api/track` is per-process, in-memory/volatile; `/api/admin/events` exposes its recent feed. |

## Important current limits

- `/admin` is public demo/mock UI. The `admin_roles` then `ADMIN_EMAILS` helper is not wired; this does not meet PRD scoped RBAC or audit requirements.
- Payment tables exist, but no Midtrans API, Snap/hosted UI, verified webhook, retries, reconciliation, or refund runtime exists.
- `analytics_events` is not written by active ingest; dashboard metrics are mock/non-authoritative.
- GSAP, Lenis, PostHog, Cloudflare SDK/config, and Midtrans runtime are absent. They are PRD targets/assumptions, not current integrations.
- Current routes differ from the PRD sitemap; see [API-CONTRACTS.md](API-CONTRACTS.md) for mapping.
