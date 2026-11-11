schema_version: 1

# Team Workplan

Source of truth: current code, `docs/MVP-SCOPE.md`, `docs/API-CONTRACTS.md`, and `docs/QA-CHECKLIST.md`.

Audience: four-person delivery team completing and wiring the `web/` application for staging and release.

## 1. Working Decision

Use `web/` as the canonical application for the MVP. It contains the frontend, Next.js route handlers, Supabase integration, admin flows, and payment flows in one deployable app.

The sibling `itb_insight/` project must not become a second backend for this MVP. UI or content can be ported from it only through an explicit task. Do not implement the same endpoint, table, or business rule in both projects.

## 2. Team Roles

Use role labels P1-P4 until names are assigned.

| Role | Primary ownership | Secondary responsibility | Final approval |
| --- | --- | --- | --- |
| P1 - Platform and Data | Auth, Supabase, schema, RLS, core domain APIs | API contract and security review | Database and authorization readiness |
| P2 - Admin and Payments | Admin APIs, check-in, payment, Midtrans, notifications | Server-side security review | Admin and payment readiness |
| P3 - Product Integration | User and admin UI, API client behavior, loading/error states | UX consistency and content wiring | Browser flow readiness |
| P4 - QA and Release | Test accounts, staging, E2E verification, deployment, evidence | Reproduction and release coordination | Release candidate readiness |

Every feature has one primary owner. A reviewer is required before the feature is marked done. The primary owner is responsible for fixing failures even when another person discovered them.

## 3. Delivery Rules

1. Work only in `web/` unless a migration task explicitly says otherwise.
2. Every API mutation must have authentication, authorization, validation, duplicate handling, and an error response.
3. Every UI mutation must have loading, success, failure, and unauthenticated states.
4. A route is not complete when it compiles. It is complete when a staging user can execute it and P4 has recorded the result.
5. Never use production data for dummy registration, team, payment, or check-in testing.
6. Server secrets stay in server-only environment variables. Never add a secret to `NEXT_PUBLIC_*`.
7. Do not merge two implementations of the same feature from `web/` and `itb_insight/` without an explicit architecture decision.
8. Keep commits small enough to review by one domain: schema, API, UI, test, or deployment.

## 4. Work Breakdown

### Workstream A - Platform, Data, and Security (P1)

#### A1. Establish the database baseline

Tasks:

- Review all Supabase migrations in `supabase/migrations/` in execution order.
- Confirm a clean staging project can apply every migration without manual edits.
- Confirm required tables, indexes, unique constraints, foreign keys, and database functions exist.
- Confirm competition seed/content matches the values used by `lib/competitions.ts` or document the source of truth.
- Record the staging project reference without recording credentials.

Files and surfaces:

- `supabase/migrations/`
- `docs/SUPABASE-SCHEMA-PLAN.md`
- `docs/DATA-MODEL.md`
- `lib/competitions.ts`

Done when:

- A clean staging database applies the migrations successfully.
- The migration order is documented.
- The team can identify which tables are read by each core API.

#### A2. Verify authentication and session behavior

Tasks:

- Verify Google OAuth callback and magic-link callback.
- Verify session refresh through `middleware.ts`.
- Verify unauthenticated requests receive `401` from protected API routes.
- Verify logout clears the session and redirects to `/`.
- Verify callback URLs exist in Supabase Auth settings for local and staging.

Files and surfaces:

- `lib/auth.ts`
- `lib/supabase/`
- `middleware.ts`
- `app/auth/callback/`
- `app/auth/login/`

Done when:

- A new user can log in and reach the dashboard.
- An expired or missing session cannot perform a protected mutation.
- P4 has captured the local and staging result.

#### A3. Lock down RLS and ownership

Tasks:

- Review RLS for profiles, visitor tickets, registrations, teams, team members, payments, and admin roles.
- Test User A and User B against read, update, and delete operations.
- Confirm service-role access is used only in server code after request-level authorization.
- Confirm team leader checks exist both in the route and in database constraints/functions where appropriate.
- Confirm QR tokens are opaque and do not contain user PII.

Done when:

- User A cannot read or mutate User B data.
- Non-leaders cannot submit or alter a team.
- Non-admins cannot access admin data or mutations.
- Findings are recorded in the QA evidence folder or release notes.

#### A4. Own core registration APIs

Endpoints:

- `POST /api/tickets/ensure`
- `POST /api/registrations/individual`
- `POST /api/teams`
- `POST /api/teams/join`
- `POST /api/registrations/team`
- Team leave and member removal endpoints

Tasks:

- Validate request JSON and required fields.
- Validate competition type and registration window.
- Ensure profile and phone requirements are handled consistently.
- Handle duplicate registration and duplicate team UID/name safely.
- Confirm final team submission is atomic and locks the team.
- Keep response shapes aligned with `docs/API-CONTRACTS.md`.

Done when:

- Happy path and duplicate path are tested.
- Team minimum and maximum members are enforced.
- A failed team submission cannot leave a partially submitted team.
- P3 has an endpoint example and error-code list for every mutation.

### Workstream B - Admin, Payment, and Notification (P2)

#### B1. Complete admin authorization

Tasks:

- Verify `admin_roles` lookup and `ADMIN_EMAILS` fallback behavior.
- Decide and document which fallback is allowed in staging and production.
- Ensure every admin API calls the shared admin authorization helper.
- Ensure admin pages do not rely on hidden navigation as authorization.
- Add or verify audit logging requirements for status changes, exports, and check-in.

Endpoints:

- `GET /api/admin/me`
- `GET /api/admin/overview`
- `GET /api/admin/registrations`
- `POST/PATCH /api/admin/registrations/[id]/status`
- `GET /api/admin/registrations/export`
- `GET /api/admin/visitors`

Done when:

- Admin user succeeds on all intended routes.
- Authenticated non-admin receives `403`.
- Unauthenticated request receives `401`.
- Export does not expose fields outside its documented contract.

#### B2. Complete gate check-in

Tasks:

- Test manual QR token input and browser scanner path.
- Validate token lookup and checked-in state server-side.
- Make repeated scans return a stable already-checked-in response.
- Confirm no geofence is assumed in the MVP.
- Verify operator-facing errors do not expose internal database details.

Endpoint:

- `POST /api/admin/check-in`

Done when:

- Valid token checks in exactly once.
- Invalid token is rejected.
- A second scan cannot create a second attendance event or corrupt the timestamp.

#### B3. Stabilize mock payment

Tasks:

- Verify payment creation is limited to the correct registration owner or team leader.
- Verify amount and registration association are determined server-side.
- Test pending, paid, failed, and expired transitions.
- Test retry after failed or expired payment.
- Confirm payment success does not automatically mark registration as verified unless the product decision explicitly changes.
- Keep mock action routes unavailable to the wrong owner.

Endpoints:

- `POST /api/payments/create`
- `GET /api/payments/[id]`
- `POST /api/payments/mock/settle`
- `POST /api/payments/mock/fail`
- `POST /api/payments/mock/expire`

Done when:

- P4 can complete all mock payment outcomes in staging.
- Duplicate action requests are safe.
- Payment status shown in the dashboard matches the database.

#### B4. Verify Midtrans Sandbox and notifications

Tasks:

- Configure sandbox server key and client key in the staging environment only.
- Confirm Snap/redirect URL is generated server-side.
- Verify webhook signature before changing payment state.
- Make webhook processing idempotent by order ID/payment ID.
- Test paid, pending, expired, failed, and duplicate notification payloads.
- Confirm production mode remains disabled until a separate go-live decision.

Endpoint:

- `POST /api/payments/midtrans/notification`

Done when:

- An invalid signature never changes payment state.
- A repeated valid notification produces no duplicate state transition.
- P4 has redacted evidence for each tested notification state.

#### B5. Own email and external service boundary

Tasks:

- Decide whether registration confirmation email is in MVP or deferred.
- If enabled, verify Resend sender configuration in staging.
- Ensure email failure does not incorrectly roll back a successful registration unless explicitly designed to do so.
- Document retry and failure behavior.

Done when:

- The team can state clearly whether email is launch-critical.
- No UI claims that an email was sent when the server reports failure.

### Workstream C - Frontend and API Integration (P3)

#### C1. Create a consistent API handling pattern

Tasks:

- Standardize parsing of `{ success, data, error }` responses.
- Map stable `error.code` values to user-facing messages.
- Handle `401` with a login redirect preserving the original destination.
- Handle `403`, `409`, `422`, `429`, and `500` distinctly where useful.
- Prevent double-submit while a mutation is pending.
- Refresh server-rendered data after successful mutations.

Primary surfaces:

- `components/dashboard/`
- `components/admin/`
- `components/header-client.tsx`
- `app/dashboard/`
- `app/admin/`

Done when:

- No form relies on string matching of an error message.
- Every mutation shows a stable pending and result state.

#### C2. Wire the visitor journey

Tasks:

- Login and return-to route.
- Competition list and detail.
- Individual registration.
- Dashboard registration status.
- Ticket generation and ticket display.
- Payment entry and payment result.
- Logout.

Flow to verify:

```text
Guest -> Login -> Dashboard -> Competition -> Register
      -> Registration status -> Payment -> Ticket/dashboard
```

Done when:

- A new staging visitor can complete the whole journey without manually opening an API route.
- Browser refresh does not lose the persisted state.

#### C3. Wire the team journey

Tasks:

- Team leader creates a team.
- Leader shares team UID outside the application.
- Second user joins with the UID.
- Leader sees member list and submits.
- Members see submitted/locked state.
- Payment state is shown for the correct registration owner/leader.

Flow to verify:

```text
Leader create -> UID -> Member join -> Team reaches minimum
-> Leader submit -> Team locked -> Payment/status visible
```

Done when:

- Invalid UID, wrong competition, duplicate membership, and locked-team cases are understandable in the UI.
- The UI does not offer actions that the API will always reject.

#### C4. Wire the admin journey

Tasks:

- Admin entry and authorization state.
- Overview metrics.
- Registration search and detail.
- Status update with rejection note.
- CSV export.
- Visitor list.
- QR/manual check-in.

Done when:

- Admin pages show server data, not placeholder metrics.
- Non-admin users cannot reach useful admin data through direct URLs.
- Long-running export and scanner errors are visible to the operator.

#### C5. Remove misleading mock/fallback UI

Tasks:

- Identify placeholder content and hardcoded data on launch-critical pages.
- Label intentional mock payment actions as staging-only.
- Ensure empty states do not look like successful zero metrics.
- Confirm competition content source: hardcoded MVP data or Sanity.
- Keep public pages usable when optional Sanity content is unavailable.

Done when:

- A reviewer can distinguish real persisted data, fallback content, and test-only behavior.

### Workstream D - QA, Release, and Operations (P4)

#### D1. Prepare staging

Tasks:

- Create or select a disposable/staging Supabase project.
- Apply migrations from a clean state.
- Configure Supabase Auth providers and redirect URLs.
- Configure environment variables without committing secrets.
- Configure Midtrans Sandbox only if B4 is active.
- Seed admin role using the approved method.
- Install dependencies and verify both the working tree and lockfile.

Required checks:

- `npm run build`
- `npx tsc --noEmit` when a focused type check is useful
- `node scripts/verify-supabase.js`
- `node scripts/test-supabase-client.js`

Done when:

- A clean checkout can build using the documented setup.
- Staging can be rebuilt without manual database patching.

#### D2. Maintain test identities

Create only in staging:

| Identity | Purpose |
| --- | --- |
| User A | Individual registration and ownership tests |
| User B | Team join and cross-user denial tests |
| Admin | Admin review, export, and check-in |
| Non-admin | Admin authorization denial tests |

Record only labels and test results. Do not put passwords, tokens, or personal data in repository documentation.

#### D3. Run the test matrix

For every feature, record:

- Test ID
- Environment
- Identity used
- Preconditions
- Action
- Expected result
- Actual result
- Evidence link or screenshot
- Bug ID if failed
- Retest result

Required test groups:

- Public page and auth checks
- Visitor ticket checks
- Individual registration checks
- Team checks
- Admin authorization and mutation checks
- Mock payment checks
- Midtrans sandbox checks
- RLS User A/User B checks
- Build and deployment checks

Use `docs/QA-CHECKLIST.md` as the minimum checklist. This workplan adds ownership and evidence requirements; it does not replace the QA checklist.

#### D4. Release candidate and rollback

Tasks:

- Review `git diff` and changed migrations before release.
- Confirm production and staging Supabase references differ.
- Confirm payment production mode is disabled unless approved.
- Confirm no test data exists in production.
- Deploy preview/staging candidate.
- Run smoke checks.
- Record release result in `docs/RELEASES.md`.
- Document rollback target and database migration risk.

Done when:

- P4 can state what was tested, what was skipped, and why.
- The release can be rolled back at the application level.
- Any irreversible migration has an owner-approved recovery plan.

## 5. Dependency Order

| Order | Work | Depends on | Owner |
| --- | --- | --- | --- |
| 1 | Choose `web/` as canonical app | Architecture decision | P1 + P4 |
| 2 | Staging environment and clean migration | Supabase project | P4 + P1 |
| 3 | Auth and RLS baseline | Schema and env | P1 |
| 4 | Core registration/team APIs | Auth, schema, competition data | P1 |
| 5 | Visitor ticket API | Auth, schema | P1 |
| 6 | UI visitor and team wiring | Stable API contract | P3 |
| 7 | Admin authorization and APIs | Auth, RLS, admin role | P2 + P1 |
| 8 | Admin UI wiring | Admin APIs | P3 |
| 9 | Mock payment | Registration and payment schema | P2 |
| 10 | Payment UI wiring | Mock payment contract | P3 |
| 11 | Midtrans Sandbox/webhook | Mock flow and staging env | P2 + P4 |
| 12 | Full E2E and security test | All candidate flows | P4 |
| 13 | Release hardening | Test results | All |

Do not start Midtrans production work before mock payment, ownership checks, and webhook idempotency are verified.

## 6. Four-Week Execution Plan

### Week 1 - Foundation

P1:

- Verify migration order and schema.
- Verify auth and RLS.
- Fix core API contract inconsistencies.

P2:

- Inventory admin and payment routes.
- Verify admin authorization helper.
- Define payment state transition table.

P3:

- Inventory every UI API call.
- Standardize mutation response handling.
- Wire login, dashboard, and individual registration.

P4:

- Prepare staging and test identities.
- Run clean build and Supabase smoke scripts.
- Create test evidence template.

Exit criteria: auth works, staging exists, core schema is known, and individual registration is testable.

### Week 2 - Core User and Admin Flows

P1:

- Finish team create/join/submit and ownership protections.
- Verify ticket ensure and duplicate behavior.

P2:

- Finish admin list, detail, status update, export, and check-in API.

P3:

- Finish team UI, ticket UI, and dashboard state refresh.
- Wire admin registration and visitor screens.

P4:

- Execute individual, team, ticket, and admin test groups.
- Log defects with reproduction steps.

Exit criteria: visitor and admin flows persist real staging data and pass basic authorization checks.

### Week 3 - Payment and Hardening

P1:

- Review payment ownership against registration/team relationships.
- Review database constraints and RLS after payment changes.

P2:

- Finish mock status transitions.
- Configure and test Midtrans Sandbox webhook.
- Decide notification behavior.

P3:

- Finish payment UI and all error states.
- Remove misleading placeholders on launch-critical paths.

P4:

- Run payment, duplicate request, webhook, and cross-user tests.
- Verify staging deployment from a clean build.

Exit criteria: mock payment is fully testable and Midtrans Sandbox has evidence for valid/invalid/duplicate notifications.

### Week 4 - Release Candidate

All:

- Fix only release-blocking defects.
- Review security findings.
- Review environment separation.
- Run full `docs/QA-CHECKLIST.md`.

P4:

- Publish release evidence and unresolved risk list.
- Run production-safe smoke checks only after approval.

Exit criteria: owner approves the release scope, known gaps are documented, and no critical authorization or data integrity issue remains open.

## 7. Handoff Template

Every handoff must contain:

```text
Feature:
Owner:
Reviewer:
Changed files:
API endpoints:
Database tables/migrations:
Environment variables:
Happy path:
Failure paths:
Authorization cases:
How to test:
Known limitations:
Evidence:
```

A handoff is rejected when it only says "done" without the test procedure and known limitations.

## 8. Definition of Ready and Done

### Definition of ready

A task can start when:

- The intended user and actor are identified.
- The endpoint or page surface is named.
- Required data tables and environment variables are known.
- Acceptance cases include at least one failure and one authorization case.
- The owner and reviewer are assigned.

### Definition of done

A task is done when:

- Code compiles and the relevant build/type check passes.
- API contract and error behavior are documented.
- Authentication and authorization are verified.
- UI loading, success, empty, and error states exist where applicable.
- Staging test passes and evidence is recorded.
- No secret or production data was added to the repository.
- Related docs and release notes are updated when behavior changed.

## 9. Escalation Rules

Escalate immediately to P1 and P4 when:

- A migration cannot run cleanly.
- RLS permits cross-user access.
- A service-role key is exposed to client code.
- Payment status can be changed by a browser request without server verification.
- Admin authorization is bypassable.
- A route contract differs between API and UI.

Do not work around these issues with UI hiding or hardcoded checks. Stop the affected flow, record the reproduction, and fix the server-side control point first.

## 10. Final Release Gate

The MVP may move from staging to production only when all are true:

- `web/` is the only canonical deployed application.
- `npm run build` passes from a clean checkout.
- Supabase migrations are applied and verified.
- Auth redirect URLs are correct.
- RLS User A/User B checks pass.
- Admin and non-admin authorization checks pass.
- Visitor ticket and registration flows pass.
- Team create/join/submit flow passes.
- Mock payment flow passes.
- Midtrans is either verified in Sandbox or explicitly deferred.
- Production payment mode is disabled unless separately approved.
- No dummy data is present in production.
- Unresolved risks are recorded in `docs/BACKLOG.md` or `docs/RELEASES.md`.
