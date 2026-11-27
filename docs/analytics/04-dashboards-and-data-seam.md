# Dashboard data seam

`src/features/admin/data/adapters.ts` is the only module an `/admin` panel gets data from. Panels
render the DTOs in `types.ts` and never know the source. `/admin` and `/admin/analytics` are
admin-only (`src/app/admin/layout.tsx`).

## Panel → source

| Panel | Adapter | Source |
| --- | --- | --- |
| KPI strip | `getKpis` | PostHog: unique visitors, page views, session length, single-page visits (7 days vs the 7 before). Supabase: registrations, tickets, check-ins, booth scans. |
| Activity by Division | `getDivisionActivity` | PostHog: events by `properties.division`, sampling-corrected. |
| Registration Funnel | `getFunnel` | PostHog: visitors → sign-up started → completed. Supabase: `admin_competition_funnel()` (0015) per competition. |
| Sponsor Performance | `getSponsorStats` | PostHog: `sponsor_impression` / `sponsor_click` by `sponsorId`, joined to the media partner list. |
| 3D Engagement Health | `getEngagement` | PostHog: `$prev_pageview_max_scroll_percentage` by device, `drone_ready` p50/p90. |
| Traffic | `getTraffic` | PostHog: `$pageview` per Jakarta day, top paths. |
| Recent Events | `getRecentEvents` | PostHog: latest events, 30 s cache. |
| **D-day live** (top of `/admin`) | `getLive` | Supabase `admin_live_onsite()` (0017) + PostHog live queries. See below. |
| Booths today (`/admin/analytics`) | `getLive` | Same call, every booth. |
| **D-Day** (`/admin/d-day`, every staff member) | `getDDay` | Supabase `admin_dday()` (0028): live headcount, check-ins per gate, booths, funnel, staff scans. 30 s cache, polled by `/api/admin/d-day`. Headcount rule: [06-dday-presence.md](06-dday-presence.md#live-headcount-admind-day). |

## Rules

- **Mock fallback.** Without `POSTHOG_PROJECT_ID` + `POSTHOG_PERSONAL_API_KEY`, the PostHog-backed
  adapters return `mockData.ts` and the header says "Mock data". The D-day live section never
  mocks: Supabase is real, and the Website Now panel says PostHog isn't configured.
- **Null means failed.** An adapter returns `null` when its source errors; the page shows
  `PanelUnavailable` instead of zeros that look real.
- **Production filter.** On `VERCEL_ENV=production` every HogQL query adds
  `properties.app_env = 'production'`, because one PostHog project serves every environment.
- **Sampling.** `sampleWeight()` turns `SAMPLE_RATES` into a HogQL `multiIf`, so sampled events
  count N times. Don't hard-code rates.
- **Caching.** HogQL: 5 min (history) or 30 s (live), keyed by the query text; `defaultRange()`
  rounds to 5 minutes so requests share an entry. D-day RPC: 30 s, keyed by the Jakarta day.
  Failures are not cached.

## D-day live

`GET /api/admin/live` (admin only, `Cache-Control: private, no-store`) returns `LiveDto`. The page
renders it on the server, then `useLiveData` polls every 30 s while the tab is visible.

| Panel | Figures |
| --- | --- |
| On Site Today | Distinct gate check-ins today, check-ins per 15 min, "active now" (presence ping in the last 5 min), visitors with tracking on. |
| Time at the Venue | Per checked-in visitor: first gate check-in → last QR scan or presence ping. Median and four bands. Visitors with nothing after check-in are reported as unknown, not as zero. |
| Booth Leaderboard | Per active booth: QR scans, presence visits ≥ 5 min, distinct visitors, median dwell (average on hover). Sortable. |
| Website Now | PostHog: distinct visitors in the last 5 min, top pages in the last 30 min. |

"Today" is the Jakarta calendar day. Presence figures are a sample; see
[06-dday-presence.md](06-dday-presence.md).

## Adding a panel

1. Add a DTO to `types.ts`.
2. Add an adapter: a HogQL query through `hogql(name, query, ttl)` (use `inRange()` and
   `envFilter()`), or a Supabase read with the service client. Return `null` on failure.
3. Add a mock to `mockData.ts` if it's PostHog-backed.
4. Test it in `adapters.test.ts` (PostHog and Supabase are both faked there).
