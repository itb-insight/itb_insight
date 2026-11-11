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
| Schema | Migrations `0001`–`0007`, fully covering PRD core entities. |
| Analytics | `/api/track` ingests to in-memory buffer and persistently stores to Supabase `analytics_events`. |

## Remaining frontend & integration milestones

- Admin frontend UI pages currently present mock panels; they can now be wired directly to the ready `/api/admin/*`, `/api/check-in/*`, and `/api/payments/*` endpoints.
- External production credentials (live Midtrans merchant account, live Supabase project) to be configured in `.env`.

