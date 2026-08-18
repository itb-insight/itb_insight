schema_version: 2

# Supabase schema plan

**Canonical migration and RLS companion to [ERD.md](ERD.md).** Migrations `0001` through `0006` are present in the repository; do not describe `0005` as latest.

## Current migration state

`0002` replaces the prototype model from `0001`; `0003`/`0004` implement the team submission and payment-schema changes; `0005` optimizes policy expressions; `0006` creates persistent analytics storage. Application runtime wiring is deliberately narrower than this schema: registration/tickets are live; payments and analytics persistence are not.

## RLS and server boundaries

- RLS is enabled on the public MVP tables. The migration policies describe database access; route behavior must still be verified in source.
- Registration and ticket mutation uses server-side service-role access after authentication and validation.
- `analytics_events` permits browser inserts in its migration, but no current runtime path inserts there.
- `admin_roles` supports the server helper’s preferred authorization check, with `ADMIN_EMAILS` fallback. It does not protect the current public admin pages.

## Planned schema gap register

Final PRD work requires designed migrations (not changes in this documentation task) for check-ins, booths and scan events, private uploads with retention, RSVP invites, feedback, partners/inquiries, programs/sessions, audit logs, and durable analytics reporting. Each must define RLS, scoped RBAC, idempotency where applicable, retention, and server-only privileged access. Do not execute `docs/analytics/schema.sql`: it is reference/proposed SQL, not a migration.
