schema_version: 2

# QA checklist

## Commands verified in `package.json`

| Check | Command |
| --- | --- |
| Development | `npm run dev` |
| Lint | `npm run lint` |
| Production build | `npm run build` |
| Production server | `npm run start` |

`npx tsc --noEmit` may be used as a direct TypeScript check but is not an npm script. Do not claim a `format` script exists.

## Current manual checks

- As a guest, visit public pages and request `/dashboard`; verify redirect to `/login?next=…`.
- Authenticate, call or exercise ticket ensure, submit an individual registration, create/join a team, and submit as leader in a non-production test environment.
- Verify a submitted team cannot be joined afterward.
- Browse a few pages with PostHog configured; confirm events reach PostHog through `/ingest` with no query strings, and appear in `/admin` Recent Events within ~30 s.
- As a non-admin, confirm `/admin` is refused and `GET /api/admin/live` returns 403.

## Planned-feature test gates

Before enabling operational admin, payments, or analytics persistence, add focused authorization, duplicate-check-in, export, payment/webhook, reconciliation, retention, accessibility (ACS-01–ACS-07), performance (PERF-01–PERF-08), and persistence tests. Do not test a nonexistent `/api/payments/**` or protected admin API as if it were current.
