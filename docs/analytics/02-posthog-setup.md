# PostHog setup

## Project (done once, in the PostHog UI)

- Region **US**, one project (`itb-insight-prod`, free plan) for local, preview and production.
- Settings: **Discard client IP data** on, web vitals autocapture on, session replay off, a $0
  billing limit, authorized URLs = localhost and the production domain.
- **Property filter transformation** (Data pipelines) drops the GeoIP properties PostHog would
  otherwise add from the IP before it's discarded (postal code, latitude/longitude). Keep it on.
- A **personal API key** with only `query:read`, limited to this project, for `/admin`.

## Environment

| Variable | Where | What |
| --- | --- | --- |
| `NEXT_PUBLIC_POSTHOG_KEY` | all | Project key (`phc_…`). Public by design. Unset = no tracking. |
| `NEXT_PUBLIC_POSTHOG_REGION` | all | `us` (or `eu`). Builds the `/ingest` rewrites in `next.config.ts`. |
| `POSTHOG_PROJECT_ID` | server | Numeric project id, for the query API. |
| `POSTHOG_PERSONAL_API_KEY` | server | `phx_…`, `query:read` only. **Never `NEXT_PUBLIC_`.** Unset = mock web panels. |

## How events get there

- `src/lib/analytics/posthog.ts` is the only module importing `posthog-js`, and only with
  `import()` on idle, so the SDK is never in first-load JS.
- Requests go to `/ingest/*` on our own domain; `next.config.ts` rewrites them to PostHog, so ad
  blockers that block posthog.com don't drop them. `src/proxy.ts` skips `/ingest` (no session
  refresh, no maintenance 503).
- `queue.ts` holds up to 100 events while the SDK loads, then hands everything to
  `posthog.capture()`. PostHog batches and retries itself. Events fired while the page is hidden
  (funnel drop-off) go by beacon.
- PostHog's own `$pageview`, `$pageleave` and `$web_vitals` replace our old page-view and
  web-vitals events.

## Privacy posture (matches `/privacy`)

- Anonymous random id in **localStorage**, no cookies, never `identify()`, `person_profiles:
  'identified_only'` (so no person profiles at all).
- No autocapture, session replay, heatmaps, surveys, feature flags or exception capture.
- `before_send` strips query strings and hashes from every URL property, because magic-link and
  OAuth callbacks carry codes there.
- IP discarded by the project setting; GeoIP detail dropped by the transformation above.
- Event metadata is flat primitives only (`EventMetadata`), and must never carry form values.

## Reading it back

`src/lib/analytics/posthog-query.ts` (server-only) sends HogQL to
`POST https://us.posthog.com/api/projects/<id>/query/`. Results are cached with `unstable_cache`:
5 minutes for history panels, 30 seconds for live ones, keyed by the query text. That keeps
`/admin` well inside PostHog's query rate limits however many admins have it open. A failed query
returns `null` and its panel says "unavailable" instead of showing zeros.
