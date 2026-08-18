schema_version: 3

# API contracts

Only **Current** rows are implemented.

## Current API and route surface

| Surface | State | Contract |
| --- | --- | --- |
| `POST /api/tickets/ensure` | Current | Authenticated create/reuse of a `visitor_tickets` QR ticket. |
| `POST /api/registrations/individual`, `POST /api/teams`, `POST /api/teams/join`, `POST /api/registrations/team` | Current | Authenticated registration/team workflow. |
| `POST /api/track`, `GET /api/admin/events` | Current | Public volatile analytics ingest/recent feed; not authoritative. |
| `/login`, `/auth/callback`, `/dashboard*` | Current | Login/callback and participant dashboard. Only `/dashboard*` is protected. |
| `/admin*` | Current demo | Public/mock; not a secure admin API or route family. |
| `/checkout` | Current static preview | Public merchant-verification checkout UI only. It has no API contract: no payment creation, Midtrans SDK/Snap call, upload, persistence, authentication requirement, or webhook. |
| `/terms-and-conditions` | Current | Public static ITB Insight 2026 Terms & Conditions page. |

## PRD target mapping (not implemented)

| PRD target | Target namespace | Current mapping |
| --- | --- | --- |
| Public sitemap | `/events`, `/competitions/[slug]`, `/map`, `/booths`, `/rsvp/[token]`, `/feedback`, `/me`, and related pages | Current public/detail routes differ; do not claim these target routes exist. |
| Participant dashboard | `/me` | Current participant route is `/dashboard`. |
| Staff/admin | `/admin`, `/admin/gate`, `/admin/booth`, `/admin/inspirates`, `/admin/competition`, `/admin/partners`, `/admin/analytics` | `/admin` exists only as public demo; target replaces stale `/panel` references. |

## Payment target — CMP-10–CMP-16

Planned server contracts must calculate amount from server-side competition configuration; create payment attempts for submitted registrations; use Midtrans hosted/Snap flow; verify signatures; process webhooks idempotently; and never treat a browser redirect as payment truth. They must support pending/paid/expired/failed/refunded display, participant retry without re-entry, reconciliation/reporting, and a documented correction/refund policy (D-11). No `/api/payments/**` or webhook is current.

## Admin/QRS target

Planned routes must authenticate and authorize server-side by scoped RBAC, record audit events for sensitive access/export, and provide gate/manual check-in, duplicate prevention, and later booth scans. UI visibility and `noindex` are not authorization.
