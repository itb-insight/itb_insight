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
- Post a valid analytics batch to `/api/track`; confirm only the current process’s recent-event feed changes. Do not treat dashboard KPIs as results.
- Confirm `/admin` is not exposed as a secure/admin-verified workflow; it is current public demo/mock state.

## Planned-feature test gates

Before enabling operational admin, payments, or analytics persistence, add focused authorization, duplicate-check-in, export, payment/webhook, reconciliation, retention, accessibility (ACS-01–ACS-07), performance (PERF-01–PERF-08), and persistence tests. Do not test a nonexistent `/api/payments/**` or protected admin API as if it were current.
