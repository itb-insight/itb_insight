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
| Public checkout preview | `/checkout` is a static merchant-verification UI for the four competition products. It validates only in-browser form state, keeps selected files local, and shows a non-operational payment-unavailable dialog. |
| Public legal page and footer | `/terms-and-conditions` publishes the ITB Insight 2026 terms. The public footer now links to it, support email, and Instagram; it is excluded from `/dashboard*` and `/admin*`. |

## Important current limits

- `/admin` is public demo/mock UI. The `admin_roles` then `ADMIN_EMAILS` helper is not wired; this does not meet PRD scoped RBAC or audit requirements.
- Payment tables exist, but no Midtrans API, Snap/hosted UI, verified webhook, retries, reconciliation, refund runtime, or payment transaction creation exists. `/checkout` is explicitly a non-operational static preview, not a payment flow.
- `analytics_events` is not written by active ingest; dashboard metrics are mock/non-authoritative.
- GSAP, Lenis, PostHog, Cloudflare SDK/config, and Midtrans runtime are absent. They are PRD targets/assumptions, not current integrations.
- Current routes differ from the PRD sitemap; see [API-CONTRACTS.md](API-CONTRACTS.md) for mapping.
