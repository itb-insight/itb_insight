schema_version: 3

# Admin dashboard

## Current state

`/admin*` is admin-only (`src/app/admin/layout.tsx`; roles from `admin_roles`, `profiles.role_a`, or a confirmed `ADMIN_EMAILS` address). Its analytics panels read PostHog and Supabase through `src/features/admin/data/adapters.ts` (mock web figures only when PostHog query credentials are unset), with a D-day live section polling `GET /api/admin/live` every 30 s. See [analytics/04-dashboards-and-data-seam.md](analytics/04-dashboards-and-data-seam.md).

## Final PRD target

Use `/admin` (not `/panel`) for scoped staff/admin routes. Server-side RBAC must distinguish admin, field staff, gate/booth staff, exhibitor, participant, and guest; least privilege applies to registration review, check-in, exports, partner/content operations, and analytics. Sensitive record access and exports require audit logging.

Target QRS operations include real-time QR validation, manual lookup fallback, idempotent gate check-in, and planned booth scan tracking. Target ADM reporting includes centralized data, exports, and durable trusted metrics. These are not implemented.
