# MVP status

**Current implementation only**, source-verified 2026-08-19. Final requirements are in [PRD(v1.0).md](PRD(v1.0).md).

## Implemented today

| Area | Current behavior |
| --- | --- |
| Runtime | Next.js 16.2.10, React 19.2.4, Supabase, MapLibre, Three.js, Framer Motion, and Lottie. |
| Auth | Google OAuth is implemented. `/dashboard*` redirects unauthenticated users to `/login?next=…`. |
| Registration | Individual/team APIs, final team submission lock, `submitted`/`verified`/`rejected` statuses. |
| Tickets & Gate | Authenticated ticket ensure uses `visitor_tickets`, gate scanning with duplicate prevention (`/api/check-in/*`). |
| Booths & Gamification | Booth directory and gate-dependent visit scanning with point accrual (`/api/booths/*`). |
| RSVP & Feedback | Tokenized VIP/alumni RSVP (`/api/rsvp/*`) and universal feedback engine (`/api/feedback`). |
| Partners & Inquiry | Tiered partner display and inquiry intake (`/api/partners/*`). |
| Payments | Midtrans Snap integration, server-side fee calculation, verified webhook, idempotent status updates, and retry flow (`/api/payments/*`). |
| Admin & Audit | Scoped RBAC helper (`@/lib/admin`), audit logging (`@/lib/audit`), live stats (`/api/admin/stats`), CSV data exports (`/api/admin/export`), and Inspirates dissemination tracking (`/api/admin/inspirates`). |
| Schema | Migrations `0001`–`0023`. |
| Analytics | Website events go to PostHog (lazy SDK, `/ingest` proxy, anonymous, no cookies). `/admin` reads PostHog through its query API and Supabase for registrations, check-ins and scans, with a D-day live section refreshed every 30 s (`/api/admin/live`). Opt-in booth presence (`/api/presence/*`, `booth_presence`) records booth visits on event days. See [analytics/00-overview.md](analytics/00-overview.md). |

## Remaining frontend & integration milestones

- Booth presence needs its venue field test (booth coordinates, radii, burst on/off) before D-Day; see [analytics/06-dday-presence.md](analytics/06-dday-presence.md).
- External production credentials (live Midtrans merchant account, live Supabase project) to be configured in `.env`.

