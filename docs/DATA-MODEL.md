schema_version: 2

# Data model ownership

[ERD.md](ERD.md) is the sole canonical schema overview. This page assigns data ownership and separates deployed schema from runtime wiring.

## Active data

- `profiles` holds the auth-linked identity and contact fields required by registration.
- `visitor_tickets` holds one opaque QR token and check-in fields per profile. It replaces legacy `rsvp`.
- `competitions` provides relational registration metadata; the hardcoded catalog remains the product content source.
- `competition_teams` and `competition_team_members` model draft teams, UID joins, and membership snapshots.
- `competition_registrations` records individual/team submission. Statuses are `submitted`, `verified`, `rejected`.
- `admin_roles` is the preferred authorization source for the existing server helper; that helper is not yet attached to `/admin`.

## Schema present but not wired

- `payments` and `midtrans_transactions` exist after migration `0004` but have no payment API, UI, Snap call, or webhook.
- `analytics_events` exists after `0006`, including RLS policies, but `/api/track` writes only to the in-memory store.

## Planned-entity gap register

These final-PRD entities are not current schema/runtime claims and require approved migrations, RLS, retention, and API wiring: `check_ins`, `booths`, `booth_scan_events`, `uploads`, `rsvp_invites`, `feedback_responses`, `partners`, `partnership_inquiries`, `programs`, `sessions`, and `audit_logs`. Payment tables are present but still need the CMP-10–CMP-16 runtime contract. Durable analytics rollups/PostHog are planned integration design, not current analytics.

## Data rules

- Keep service-role access server-only.
- Do not use `rsvp` for new ticket work.
- Payment state, when implemented, must remain separate from registration verification.
- Team membership changes stop after final submission.
