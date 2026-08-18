schema_version: 3

# Admin dashboard

## Current state

`/admin*` is public demo/mock UI. `admin_roles` then `ADMIN_EMAILS` exists only as an unused helper. `GET /api/admin/events` is public and analytics metrics are volatile/mock. This is not final PRD RBAC.

## Final PRD target

Use `/admin` (not `/panel`) for scoped staff/admin routes. Server-side RBAC must distinguish admin, field staff, gate/booth staff, exhibitor, participant, and guest; least privilege applies to registration review, check-in, exports, partner/content operations, and analytics. Sensitive record access and exports require audit logging.

Target QRS operations include real-time QR validation, manual lookup fallback, idempotent gate check-in, and planned booth scan tracking. Target ADM reporting includes centralized data, exports, and durable trusted metrics. These are not implemented.
