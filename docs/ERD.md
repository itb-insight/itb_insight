# ERD and schema overview

**Canonical schema overview.** SQL migrations in `supabase/migrations/` are authoritative. This page describes the resulting chain, not proof that a particular remote project has applied it.

## Migration chain

| Migration | Effect |
| --- | --- |
| `0001_initial_schema.sql` | Initial prototype, including legacy `registrations` and `rsvp`. |
| `0002_mvp_schema.sql` | Rebuilds the MVP tables: profiles, visitor tickets, competition/team/registration tables, and admin roles. |
| `0003_submit_team_registration.sql` | Adds the team-submission RPC. |
| `0004_payment_schema.sql` | Sets registration statuses to `submitted`/`verified`/`rejected`, updates the RPC, and adds payment tables. |
| `0005_rls_initplan_optimization.sql` | Rewrites RLS policies to use `(select auth.uid())`. |
| `0006_analytics_events.sql` | Adds `analytics_events`, indexes, and write-only browser insert/read-for-admin policies. |
| `0007_backend_complete_schema.sql` | Adds booths, booth_scan_events, gate_check_ins, rsvp_invites, feedback_responses, partners, partnership_inquiries, inspirates_records, audit_logs; expands scoped roles & payment statuses. |

`0002` drops the legacy `registrations` and `rsvp` tables. Use `visitor_tickets`, never `rsvp`, for current QR tickets.

## Tables and runtime wiring

| Table | Purpose | Active runtime use |
| --- | --- | --- |
| `profiles` | Auth-linked profile | Yes. |
| `visitor_tickets` | One opaque QR ticket and check-in fields per user | Yes; ticket ensure & check-in. |
| `gate_check_ins` | Gate check-in audit log and multi-gate records | Yes; `/api/check-in/*`. |
| `booths`, `booth_scan_events` | Booth directory and gamification point logging | Yes; `/api/booths/*`. |
| `rsvp_invites` | Tokenized VIP and alumni invitation & confirmation | Yes; `/api/rsvp/*`. |
| `feedback_responses` | Universal feedback engine (event, booth, inspirates) | Yes; `/api/feedback`. |
| `partners`, `partnership_inquiries` | Partner tiered display and inquiry handling | Yes; `/api/partners/*`. |
| `inspirates_records` | Inspirates school dissemination logging | Yes; `/api/admin/inspirates`. |
| `audit_logs` | Audit trail for sensitive access and data export | Yes; recorded on exports/check-ins. |
| `competitions` | Registration metadata/foreign keys | Yes; registration APIs keep/find rows for catalog. |
| `competition_teams`, `competition_team_members` | Team UID, leader, and membership | Yes. |
| `competition_registrations` | Individual/team submissions and status | Yes. |
| `admin_roles` | Scoped RBAC authorization (`admin`, `gate_staff`, `booth_staff`, etc.) | Yes; `@/lib/admin`. |
| `payments`, `midtrans_transactions` | Midtrans Snap creation, webhook, and retry | Yes; `/api/payments/*`. |
| `analytics_events` | Persistent analytics storage | Yes; `/api/track` writes to table. |

## Important constraints

- Registration statuses are `submitted`, `verified`, and `rejected`; a team stays `draft` until final submission.
- Payment statuses are `pending`, `paid`, `failed`, `expired`, `cancelled`, and `refunded`.
- The `submit_team_registration` RPC validates the leader and min/max team size atomically and moves a team to `submitted`.
- RLS is enabled across all tables; privileged operations use server-side `createServiceClient()`.

