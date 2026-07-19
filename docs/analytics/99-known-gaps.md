# Known Gaps

What the MVP does not do, in priority order. Read this before deploying.

---

## 1. `/admin` has no authentication — BLOCKING

Anyone with the URL can read the raw event feed and every dashboard figure. `robots: noindex` is set
in `src/app/admin/layout.tsx` as a floor, **not a control**.

The spec describes a `stakeholder` role that sees all divisions while others see only their own
tagged data. None of that exists — there is no session, no role, and no user concept anywhere in the
codebase. `src/features/auth/` is UI shells with dead buttons.

**Needed before this is public:** real auth, a role check in the admin layout, and division scoping
in the adapters (a stakeholder sees everything; a division lead's queries get a `WHERE division = $1`).

---

## 2. No database — everything is mock data

Every dashboard number except the Recent Events feed comes from
`src/features/admin/data/mockData.ts`. No Postgres, no ORM, no migrations, no env vars.

[schema.sql](schema.sql) is the reference DDL and is executed by nothing. It carries its own
"MVP deviations" section at the bottom — read it before adopting the schema, particularly:

- The app stores parsed `device_type`/`browser`/`os` instead of a raw `user_agent`, deliberately.
  The DDL has neither; add the columns or fold them into metadata.
- `session_id` is `UUID` in the DDL, but the client falls back to a non-UUID random id in insecure
  contexts. Use `TEXT`, or validate before insert.

**Swap path:** change the body of each function in `src/features/admin/data/adapters.ts`. Nothing
above the seam changes. See [04-dashboards-and-data-seam.md](04-dashboards-and-data-seam.md).

---

## 3. The event store is volatile and per-process

500-event in-memory ring buffer. It empties on restart and redeploy, and on serverless each instance
holds its own copy — so the feed shows an arbitrary partial slice of traffic, not the whole stream.

This is acceptable **only** because of a hard rule: the buffer feeds the Recent Events panel and
nothing else. No dashboard aggregate reads it. If you ever point an aggregate at it, the numbers will
be silently wrong.

---

## 4. Rate limiting is per-process and easily bypassed

Fixed-window in-memory counter, 30 req/min. N instances means N × the budget; it resets on redeploy;
rotating IPs or a spoofed `x-forwarded-for` defeat it unless the platform overwrites that header.

**Swap point:** `check(key)` in `src/lib/analytics/server/rateLimit.ts`. Only the body changes —
Upstash, Vercel KV, or a platform WAF rule. The spec also mentioned WAF/rate-limiting planned for
security hardening; make sure `/api/track` is explicitly covered, since it's a public write endpoint.

---

## 5. Sampling rates are unvalidated guesses

`scroll_depth` 1-in-10, `section_impression` 1-in-2, in `src/lib/analytics/config.ts`. These have
never been checked against real event-day traffic. Too aggressive and low-traffic pages produce
noise; too lax and you hammer the endpoint during a spike.

**Any aggregate over a sampled type must scale by its rate.** Nothing enforces this yet — a query
that forgets will silently under-report by 10×. Consider storing the sample rate on the event row so
the correction is self-documenting.

---

## 6. No materialized views or scheduled aggregates

The spec is explicit that dashboard queries should be materialized views or scheduled rollups, not
live `COUNT()` over raw events, because event-day traffic spikes and admin queries shouldn't compete
with the site for DB resources. Moot while data is mocked; do it as part of gap #2, not after.

---

## 7. `drone_ready_ms` is not time-to-interactive

It's mount → first rendered frame. Real TTI isn't measurable from userland. Named honestly
everywhere including on-screen, but don't let it get relabelled in a future dashboard. Genuine
LCP/INP/TTFB come from `web_vital` events.

---

## 8. Instrumentation coverage is thin

One consumer of each mechanism was wired to prove the templates work:

| Mechanism | Live example |
|---|---|
| Impression + scroll | `landing/components/MediaPartnersSection` |
| Click | `MediaPartnersSection/PartnerCard` |
| Funnel + drop-off | `auth/SignUp` |
| WebGL perf | `landing/components/TimelineSection` → `features/drone` |

**Not instrumented:** competition pages, event map, exhibition, seminar, login. QR check-in has no
implementation to instrument at all, so the check-in rate KPI is entirely mock. Sponsor ids on the
landing page are placeholders (`partner-alpha`, `partner-1`) — they must match real `sponsors.id`
values before CTR means anything.

---

## 9. Smaller things

- **No tests.** Verification was manual (curl for the endpoint, headless Chrome for batching,
  drop-off, and the cube). Highest-value units to cover: `validate.ts` PII stripping, `rateLimit.ts`
  windowing, `funnelJournal.ts` forward-only ordering.
- **No date range control.** Adapters accept a `range` and ignore it. The signature is ready.
- **`/admin` does not auto-refresh.** The reference mock claimed a 60s refresh; this doesn't.
- **The dashboard grid leaves ragged whitespace** when panels have unequal heights.
- **Missing `favicon.ico`** — pre-existing 404, unrelated to analytics.
- **Two contradictory greyscales in the codebase.** `globals.css` defines a dark tokenized ramp;
  the auth and competition pages hardcode a light one (`#D9D9D9`, `#fff`). The admin area uses the
  dark tokens. Worth reconciling.
- **`@source "../features"` in `globals.css`** covers neither `src/app` nor `src/layouts`. Harmless
  today since the admin uses CSS Modules, but it will bite whoever first reaches for a Tailwind
  utility there.
