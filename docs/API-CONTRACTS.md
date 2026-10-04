schema_version: 3

# API contracts

Only **Current** rows are implemented.

## Current API and route surface

| Surface | State | Contract |
| --- | --- | --- |
| `POST /api/tickets/ensure` | Current | Authenticated create/reuse of a `visitor_tickets` QR ticket. |
| `POST /api/registrations/individual`, `POST /api/teams`, `POST /api/teams/join`, `POST /api/registrations/team` | Current | Authenticated registration/team workflow. |
| `POST /api/check-in/scan`, `POST /api/check-in/self`, `POST /api/check-in/manual` | Current | Gate scanner (staff), self-scan, and manual lookup with duplicate prevention. |
| `GET /api/booths`, `POST /api/booths/scan`, `GET /api/booths/progress` | Current | Booth catalog, gate-dependent visit scanning, and gamification progress. |
| `GET /api/rsvp/[token]`, `POST /api/rsvp/[token]` | Current | Tokenized RSVP invitations and response submission with substitution support. |
| `POST /api/feedback`, `GET /api/feedback` | Current | Universal feedback engine (event, booth, inspirates) and staff summary. |
| `GET /api/partners`, `POST /api/partners/inquiry` | Current | Tiered partners listing and integrated inquiry submission. |
| `POST /api/payments/create`, `POST /api/payments/webhook`, `GET /api/payments/status` | Current | Midtrans Snap session creation (server-side fee), verified webhook, and status retry. |
| `GET /api/admin/stats`, `GET /api/admin/export` | Current | Live analytics statistics and audited CSV data export (registrations, visitors, feedback, rsvp). |
| `GET /api/admin/inspirates`, `POST /api/admin/inspirates` | Current | Inspirates dissemination records for field staff. |
| `POST /api/track`, `GET /api/admin/events` | Current | Analytics ingest (in-memory ring buffer + persistent Supabase insert) and feed. |
| `/login`, `/auth/callback`, `/dashboard*` | Current | Login/callback and participant dashboard. Only `/dashboard*` is protected. |

## PRD target mapping

| PRD target | Target namespace | Current mapping |
| --- | --- | --- |
| Public sitemap | `/events`, `/competitions/[slug]`, `/map`, `/booths`, `/rsvp/[token]`, `/feedback`, `/me`, and related pages | Frontend route mapping in progress. |
| Participant dashboard | `/me` | Current participant route is `/dashboard`. |
| Staff/admin | `/admin`, `/admin/gate`, `/admin/booth`, `/admin/inspirates`, `/admin/competition`, `/admin/partners`, `/admin/analytics` | Backend endpoints ready and secured by scoped RBAC in `@/lib/admin`. |

