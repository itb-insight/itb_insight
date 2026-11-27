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
| `0008_catalog_alignment_and_payment_safety.sql` | Aligns competitions with the real catalog; removes an unsafe payment default. |
| `0009_feedback_forms.sql` | Configurable feedback engine (`feedback_forms`, `feedback_submissions`). |
| `0010_booth_staff_scan.sql` | Booth points awarded by booth staff scanning the visitor's QR. |
| `0011_profile_roles.sql` | `profiles.role_a` / `role_b`. |
| `0012_admin_manual_points.sql` | Manual point awards (`booth_scan_events.booth_id` null). |
| `0013_close_open_inquiry_policy.sql` | Closes direct inserts into `partnership_inquiries`. |
| `0014_form_registrations_shadow_members.sql` | Off-site (Google Form) teams and shadow members. |
| `0015_email_outbox.sql` | Email campaigns and outbox. |
| `0016_booth_presence.sql` | Booth `lat`/`lng`/`presence_radius_m`, `profiles.presence_consent_at`, `booth_presence`, `record_booth_presence()`. |
| `0017_admin_live.sql` | `admin_live_onsite()` for the D-day live panels; `booth_scan_events (scanned_at)` index. |
| `0018_profile_role_b_divisions.sql` | Committee bidang values for `profiles.role_b`. |
| `0019_profile_role_grants.sql` | `profile_role_grants`: roles pre-assigned by email, applied on verified sign-in. |
| `0020_analytics_to_posthog.sql` | Drops `analytics_events` (web analytics moved to PostHog); adds `admin_competition_funnel()`. Was `0015` (duplicate number). |
| `0021_sidequests_and_gamification.sql` | Sidequests, submissions, reward tiers/claims; negative manual adjustments. Was `0016` (duplicate number). |
| `0022_booth_bonus_awards.sql` | `booth_scan_events.kind` (`visit`/`bonus`/`manual`), base points once per booth, capped repeat-visit bonus via `award_booth_bonus()`. |
| `0023_security_hardening.sql` | Column-level `profiles` update grants and field length limits (was a duplicate `0007`; safe to re-run). |
| `0024_profile_staff_duties.sql` | `role_b` `human_resource`; `role_c` holds a staff duty (`gate_staff`) that grants that scoped role (`has_role()`, `getUserRole`). Gate staff = `staff` / `human_resource` / `gate_staff`, pre-assigned via `profile_role_grants`. |
| `0026_profile_visit_flags.sql` | `profiles.entered_gate` (scanned at the gate, `/admin/gate`) and `profiles.visited_itb` (phone seen inside the event zone: presence ping or self check-in). Both default false, only ever set to true, server-written only. |
| `0028_dday_live.sql` | `profiles.left_area_at` (phone reported leaving the event zone, time only, `/api/presence/exit`); `admin_dday()` for `/admin/d-day`: live headcount (5 h after the last in-area signal unless an exit came after it), check-ins, booths, funnel, staff scans. |

`0002` drops the legacy `registrations` and `rsvp` tables. Use `visitor_tickets`, never `rsvp`, for current QR tickets.

## Tables and runtime wiring

| Table | Purpose | Active runtime use |
| --- | --- | --- |
| `profiles` | Auth-linked profile | Yes. |
| `visitor_tickets` | One opaque QR ticket and check-in fields per user | Yes; ticket ensure & check-in. |
| `gate_check_ins` | Gate check-in audit log and multi-gate records | Yes; `/api/check-in/*`. |
| `booths`, `booth_scan_events` | Booth directory and gamification point logging | Yes; `/api/booths/*`. |
| `rsvp_invites` | Tokenized VIP and alumni invitation & confirmation | Yes; `/api/rsvp/*`. |
| `feedback_responses` | Legacy feedback table, read-only since 0009 | No. |
| `feedback_forms`, `feedback_submissions` | Configurable feedback engine (0009) | Yes; `/api/feedback/[slug]`. |
| `partners`, `partnership_inquiries` | Partner tiered display and inquiry handling | Yes; `/api/partners/*`. |
| `inspirates_records` | Inspirates school dissemination logging | Yes; `/api/admin/inspirates`. |
| `audit_logs` | Audit trail for sensitive access and data export | Yes; recorded on exports/check-ins. |
| `competitions` | Registration metadata/foreign keys | Yes; registration APIs keep/find rows for catalog. |
| `competition_teams`, `competition_team_members` | Team UID, leader, and membership | Yes. |
| `competition_registrations` | Individual/team submissions and status | Yes. |
| `admin_roles` | Scoped RBAC authorization (`admin`, `gate_staff`, `booth_staff`, etc.). A staff duty in `profiles.role_c` (0024) also grants its role; an `admin_roles` row wins over it. | Yes; `@/lib/admin`. |
| `payments`, `midtrans_transactions` | Midtrans Snap creation, webhook, and retry | Yes; `/api/payments/*`. |
| `booth_presence` | Opt-in booth visits (booth + time, never coordinates), service role only | Yes; `/api/presence/ping`, `/api/admin/live`. |

## Important constraints

- Registration statuses are `submitted`, `verified`, and `rejected`; a team stays `draft` until final submission.
- Payment statuses are `pending`, `paid`, `failed`, `expired`, `cancelled`, and `refunded`.
- The `submit_team_registration` RPC validates the leader and min/max team size atomically and moves a team to `submitted`.
- RLS is enabled across all tables; privileged operations use server-side `createServiceClient()`.

