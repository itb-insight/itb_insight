# Feedback (FBK-01..05)

Used for the D-day, pre-events and competitions. **First use case: Inspirates 2026**
(`docs/references/CPWR_INSPIRATES.pdf`). One engine serves every form: questions are data,
not tables.

## Requirements (original)

- Shown as a page/pop-up; later also from the user's notifications (not yet implemented).
- Triggers: QR scan, a set time (nearing the event's end), or leaving the event area (geofence).
- Name and email are always required. Signed-in users get them filled automatically;
  otherwise the browser's autofill is offered, else manual input.
- Input validation and CI tests to keep spam out.

## Data model — `supabase/migrations/0009_feedback_forms.sql`

| Table | Purpose |
|---|---|
| `feedback_forms` | One row per questionnaire: `slug`, `title`, `context`, `questions` (jsonb), `opens_at`/`closes_at`, `is_active`, `pii_retention_days`. |
| `feedback_submissions` | One row per response: `form_id`, `user_id?`, `name`, `email`, `overall_rating`, `answers` (jsonb keyed by question id), `consent_at`, `created_at`. Unique per `(form_id, lower(email))`. |
| `feedback_<slug>` views | Flat view per form for analysts (e.g. `feedback_inspirates_2026`), one column per question. `security_invoker`, admin-only. |
| `feedback_responses` | **Legacy** (0007). Kept read-only; nothing writes to it any more. |

Instead of a new table per event (the original idea), a new event is a new row in
`feedback_forms`, plus optionally a view named `feedback_EVENT_NAME`. No DDL per event, one set
of RLS policies, one API, and admin stats/exports work across all forms.

### Question types (`src/lib/feedback/schema.ts`)

| `type` | Input | Rules |
|---|---|---|
| `stars` | 1–5 stars. `"overall": true` marks the form's overall rating (max one per form) and copies it to `overall_rating`. | integer 1–5 |
| `long` | Essay | ≤ 1000 words **and** ≤ 7000 chars (catches text without spaces) |
| `short` | Short answer | ≤ 200 chars, single line |
| `scale` | Numbered 1–N (or 0–N) with optional end labels | `min` 0/1, `max` 2–10 |
| `choice` | Pick one option (added for Inspirates) | value must be one of `options[].value` |

Every question has `id` (snake_case and stable: it is the answers key), `label`, optional
`help`, and `required` (default `false`). Unknown answer keys are rejected; empty optional
answers are not stored.

### Testing outside the open window

Set `FEEDBACK_FORCE_OPEN=true` in `.env.local` to treat every form as active and open
(ignores `is_active`, `opens_at`, `closes_at`). It is ignored when `NODE_ENV=production`
(`next start`, Vercel), so it only works under `next dev`. Submissions made this way are real
rows in whichever database `.env.local` points to.

### Adding a form

Insert a row (SQL editor or a new migration), using the Inspirates seed in 0009 as a template.
`questions` is validated when the form loads; a malformed form returns 404 and logs the zod
issues. `npm test` also parses the Inspirates seed straight from the migration.

## Flow

- Page: `/feedback/[slug]` (server-rendered, `noindex`). Choice questions can be pre-filled by
  query string, e.g. a per-school QR: `/feedback/inspirates-2026?school=sman-1-bandung`.
- API: `GET /api/feedback/[slug]` (public form definition), `POST /api/feedback/[slug]` (submit),
  `GET /api/feedback?form=<slug>` (staff summary), `GET /api/admin/export?type=feedback&form=<slug>` (CSV).
- Signed in: name/email come from the profile **on the server**; the request body is ignored.
- Not signed in: name/email inputs with `autocomplete="name"` / `"email"`. Browsers cannot
  silently share the Google account email with a site; autofill is the realistic version.
  "Continue with Google" would give a *verified* email but is effectively logging in.
- Anonymous emails are unverified (accepted trade-off). One response per email per form;
  a repeat gets `409 ALREADY_SUBMITTED`.

## Anti-spam (in order of execution)

1. **No direct DB writes.** No insert policy for `anon`/`authenticated`; only the API (service
   role) inserts. 0009 also closes the old open insert policy on `feedback_responses`.
2. **Rate limit** (`feedback-submit`): 10 per 10 min per email or account, 300 per 10 min per IP.
   The IP limit is high on purpose: a whole class submits from one school NAT. It is in-memory
   per instance, so add a Cloudflare WAF rate-limit rule on `/api/feedback/*` for a global cap.
3. **Envelope validation** (zod), **honeypot** field (filled: fake success, nothing stored), and
   a **minimum fill time** of 2.5 s.
4. **Open window**: `is_active`, `opens_at`, `closes_at`.
5. **Identity and answer validation** against the form.
6. **Cloudflare Turnstile** when `TURNSTILE_SECRET_KEY` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` are
   set (managed mode, invisible to most users). Fails closed if Cloudflare can't be reached.
7. **Unique constraint** on `(form_id, lower(email))`.

Tests: `src/lib/feedback/*.test.ts`, `src/lib/rate-limit.test.ts` (`npm test`). CI:
`.github/workflows/ci.yml` runs typecheck and tests on PRs to `dev`/`main`.

## Privacy

- **Consent**: a required checkbox stating the purpose (evaluating this activity), that data is
  not shared, and the retention period. `consent_at` is stored with each row.
- **Minors** (Inspirates participants are SMA/SMK students): the form asks under-18s to make sure
  a parent/guardian or teacher knows. Ask each school to inform parents as part of the visit
  arrangement, and have the team's advisor confirm this is enough under UU PDP.
- **Minimisation**: only name, email and answers. No IP, user agent or device data is stored
  (IPs are hashed in memory for rate limiting only). The form asks people not to type other
  personal data into free-text fields.
- **Retention**: `select private.purge_expired_feedback_pii();` wipes name, email and user link
  `pii_retention_days` (default 180) after `closes_at`; ratings and answers remain for reports.
  Schedule it with pg_cron (command in the migration) or run it after each event report.
- **Access**: RLS limits reads to admins; views are `security_invoker` with grants revoked; CSV
  exports are audit-logged and protected against spreadsheet formula injection.

## Triggers — status

| Trigger | Status |
|---|---|
| QR scan | **Ready**: print a QR for `/feedback/<slug>` (optionally with `?<question>=<value>`). |
| Set time / pop-up | Not built; needs the PWA/notification work. Forms already carry `opens_at`. A dashboard banner can list open forms the user attended but hasn't submitted. |
| Geofence exit | Not built. Web pages cannot geofence in the background (no background location for PWAs, notably on iOS), so it only works while the page is open. See CLAUDE.md. |
| Follow-up email | Suggested fallback for the time trigger; not built. |

Booth feedback (FBK-03): one form per booth (`context = 'booth'`), or a `choice` question for the
booth when there are many.
