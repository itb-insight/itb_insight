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
- As a guest, visit `/checkout`; select each competition and pricing period, complete the local-only required inputs, and confirm the dialog states that payment is unavailable. Verify that submitting creates no checkout/form/file/payment request, upload, payment token, or transaction. Existing page analytics (`/api/track`) and configured navbar auth checks may still run, but must not contain checkout form values or file data.
- Verify the `/checkout` guardian-consent acknowledgement is required for Microdrone, Business Plan Competition, and Engineering Olympiad, while the Terms & Conditions checkbox is always required.
- Verify `/terms-and-conditions` contains the August 2026 ITB Insight terms, including HMFT-ITB, and the public footer links to the terms, `mailto:support@itbinsight.com`, and `https://instagram.com/itbinsight`. Confirm the footer is absent on `/dashboard*` and `/admin*` and occurs only once on public pages.

## Planned-feature test gates

Before enabling operational admin, payments, or analytics persistence, add focused authorization, duplicate-check-in, export, payment/webhook, reconciliation, retention, accessibility (ACS-01–ACS-07), performance (PERF-01–PERF-08), and persistence tests. Do not test a nonexistent `/api/payments/**` or protected admin API as if it were current.
