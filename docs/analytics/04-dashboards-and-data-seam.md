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

## Insight pages (`/admin/web`, `/admin/registrations`, `/admin/feedback`, `/admin/sponsor`)

The real versions of the `/admin-hifi/*` designs, admin-only (the `(admin-only)` route group) and
in the menu under Data as Web, User, Feedback and Sponsor. Their adapters live in their own modules
(`web.ts`, `registrations.ts`, `feedback.ts`, `sponsor.ts`) and are re-exported from `adapters.ts`,
so pages still import from the seam. Shared helpers (`lastDays`, `inRange`, `sampleWeight`,
`selectAll` for paging past PostgREST's 1000-row cap) are in `query.ts`.

| Page | Adapter | Source |
| --- | --- | --- |
| Web: summary, Kunjungan, Asal Traffic, Di mana visitor berhenti | `getWebInsights` | PostHog, 30 days (chart up to 120): page views, distinct visitors, session length, single-page sessions; sources from each session's first `utm_source`, else `$referring_domain` (`classifySource`: no referrer or our own domain = direct, so untagged WhatsApp shares land there); funnel = landing `/` → sign-up completed → `/register*` → Midtrans payments settled (Supabase). |
| Web: Error Monitor | — | No uptime or 5xx source yet: shown as "—" with links to PostHog, Vercel and Search Console. |
| User | `getRegistrations` | Supabase: every `competition_registrations` row with its team, members, and payments. Status (`registrationStatus`): withdrawn → paid or verified = registered → pending or none = awaiting payment → otherwise expired. Finalist attendance has no source (no finalist flag). |
| Feedback | `getFeedbackInsights` | Supabase: all `feedback_forms` and submissions. Ratings per form (overall) and per other star/scale question rescaled to 0–5; response rate = checked-in visitors (`gate_check_ins`) who responded ÷ checked-in visitors. The table shows the newest 1,000. |
| Sponsor | `getSponsorWeb`, `getBoothInsights` | Sponsors and booths aren't linked in the database, so the admin picks both (`?sponsor=&booth=`). PostHog, 14 days: media-partner section impressions (shared by every partner) and this partner's clicks. Supabase: the booth's QR scans per Jakarta hour and day, against checked-in tickets. Map hotspot opens and booth feedback have no source yet. |

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
