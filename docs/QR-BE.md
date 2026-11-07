# QR Features — Backend Checklist

Companion to [QR-FEATURES.md](./QR-FEATURES.md) and [QR-FE.md](./QR-FE.md).

Current backend: `src/lib/tickets.ts`, `src/lib/check-in.ts`, `src/lib/booths.ts`, routes under `src/app/api/{tickets,check-in,booths}`, migration `supabase/migrations/0009_qr_features_alignment.sql`. The core flows work; the items below are gaps, bugs and hardening found in a code scan.

## P0 — Bugs / correctness

- [ ] **Perimeter update violates the check-in constraint.** `updateVisitorBoothPerimeter` (`src/lib/booths.ts` ~L406) sets `checked_in = true` without `checked_in_at`. `visitor_tickets_checked_in_consistency` (0002) rejects that for not-yet-checked-in visitors, so the whole update fails and the fallback drops `current_booth_id` / `is_on_campus`. Fix: include `checked_in_at` (keep existing value if set) in the extended update.
- [ ] **Perimeter call marks attendance with no location.** Same function: with no coords and no `withinPerimeter`, `insideCampus = withinPerimeter !== false` → `true`. Any authenticated call to `POST /api/booths/scan {action:"perimeter"}` marks the user as attending. Require coordinates (or treat missing coords as "unknown → don't touch attendance").
- [ ] **Self check-in with no location defaults to `enter`.** `processCampusGeoAttendance` resolves to `enter` when neither `event` nor coords are given. Decide policy: require coords for geofence enter, and allow coord-less enter only from the gate poster flow (FE-8) with a distinct `gateName`/type.
- [ ] **Bonus top-up is a non-atomic read-modify-write.** Two staff adding bonus at the same time can exceed `max_bonus_points` or lose an update. Move the award into a Postgres function (RPC) that locks the `booth_scan_events` row (`select … for update`) or does a conditional `update … where bonus_points_awarded + $n <= $max`.
- [ ] **First-visit insert race.** Two simultaneous first scans: one insert hits `unique(user_id, booth_id)`, then falls into the 0007 fallback insert, which also fails → returns `DATABASE_ERROR`. Handle unique-violation (`23505`) by re-reading and treating it as a repeat scan (the RPC above solves this too).
- [ ] **PostgREST filter injection in manual search.** `searchVisitorsManual` interpolates user input into `.or(\`email.ilike.%${q}%,…\`)`. Commas/parentheses in the query break or alter the filter. Escape/strip `,()` or use two separate `ilike` queries and merge.

## P1 — Security / authorization

- [ ] **Bind booth staff to booths.** Today any `booth_staff` can award points at *any* booth by passing `boothId` (explicit identifier wins in `resolveBoothForStaff`). Add a `booth_staff_assignments (booth_id, user_id)` table (or reuse `exhibitor_user_id` for single-owner booths) and enforce: non-admin staff may only award at assigned booths. Same check for `GET /api/booths/scan`.
- [ ] **Drop the raw-UUID QR fallback** once FE-1 ships (`resolveVisitorByPersonalQr` step 2 and `processGateCheckIn` UUID branch). User IDs aren't secret, so anyone who knows an ID can impersonate that visitor's QR.
- [ ] **Rate limit QR endpoints** with `src/lib/rate-limit.ts` (already used by registration/team routes): `POST /api/booths/scan`, `POST /api/check-in/scan`, `POST /api/check-in/self`, `POST /api/check-in/manual`.
- [ ] **Validate inputs**: coordinates in range (lat ±90, lng ±180), `bonusPoints` upper bound, `activityNote` max length (~200), `gateName` against a known list/pattern.
- [ ] **Manual search response**: stop returning the visitor's raw `qr_code` token to gate staff; return `ticketId` and have `action:"check_in"` accept `ticketId`.
- [ ] **Geofence is client-trusted.** Accept as a known limitation (document it), or add plausibility checks (e.g. reject enter/exit flapping faster than N seconds, ignore impossible jumps).

## P1 — Missing features

- [ ] **Live count staleness / heartbeat.** If a visitor closes the app on campus, they never send `exit` and stay `is_on_campus = true` forever. Add `last_seen_at` on `visitor_tickets`, update it on any geofence/perimeter/scan call, and compute live count as `is_on_campus AND last_seen_at > now() - interval '…'` (or a cron that auto-exits stale visitors at event close).
- [ ] **Use the new check-in types.** 0009 added `geofence_enter` / `geofence_exit`, but code logs geofence entry as `self_scan` and never logs exit. Log both into `gate_check_ins` with the new types (keeps a proper entry/exit history for analytics).
- [ ] **Gate poster QR support (FE-8).** Decide the type for poster scans (e.g. `self_scan` with `gate_name = <slug>`), validate gate slugs, and make sure it doesn't set `gate_confirmed` (that's reserved for staff scans).
- [ ] **Booth management (admin).** No endpoints exist to create/update booths, so `points`, `max_bonus_points`, `perimeter_radius_meters`, coordinates and exhibitor/staff assignment can only be set in SQL. Add `GET/POST/PATCH /api/admin/booths` (admin only, audit logged).
- [ ] **Booth seed data.** No booths exist in migrations/seed. Add a seed (`supabase/seed.sql`) with real booth names, coordinates and point config for dev/staging.
- [ ] **`booths.qr_code` is now unused by the flow** (staff scan visitors, not the reverse) but is `not null unique`. Either make it nullable or auto-generate it on insert.
- [ ] **Exports.** `GET /api/admin/export` has tickets and feedback but no booth scans/points. Add a `booth_scans` export (visitor, booth, standard, bonus, awarded_by, note, time) and add `is_on_campus` / `gate_confirmed` / entry-exit timestamps to the tickets export.
- [ ] **Admin stats.** Add total points awarded (standard/bonus) and per-booth visit counts to `GET /api/admin/stats`.

## P2 — Performance / cleanup

- [ ] `getLiveVisitorStats` loads every `visitor_tickets` row into memory. Replace with `count: 'exact', head: true` queries (or a SQL view/RPC).
- [ ] `updateVisitorBoothPerimeter` fetches all active booths on every call. Cache the booth list briefly or filter by bounding box in SQL.
- [ ] Remove the pre-0009 fallback paths once 0009 is confirmed applied on every environment (they also hide real errors, like the constraint bug above).
- [ ] Remove unused exports: `recordBoothScan`, `getBoothByQrCode`.
- [ ] Regenerate/align `src/lib/types/database.ts` with the 0009 columns (`BoothScanEvent` breakdown fields, `last_seen_at` once added).
- [ ] Update `docs/API-CONTRACTS.md`: `/api/booths/scan` is described as "gate-dependent visit scanning", which is no longer true. Document the request/response of the perimeter action and bonus points.

## P3 — Optional (PRD "C" items)

- [ ] **Leaderboard** (`QRS-10`): `GET /api/booths/leaderboard` with top N by total points (SQL view summing `booth_scan_events.points_awarded`).
- [ ] **Reward claim** (`QRS-11`): `reward_claims` table with unique `(user_id, reward_id)`, threshold check, staff-only claim endpoint, audit log.

## Verification
- [ ] No test runner exists (`package.json` only has `dev/build/start/lint`). At minimum add unit tests for `isInsideGaneshaCampus`, `isWithinBoothPerimeter`, and the award rules (first visit, idempotent repeat, bonus cap, concurrent bonus).
- [ ] Manual QA script in `docs/QA-CHECKLIST.md` for gate scan, booth award, bonus top-up, geofence enter/exit, live count.
