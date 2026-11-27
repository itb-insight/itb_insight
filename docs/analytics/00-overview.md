# Analytics overview

Two sources, one admin view.

```text
Website   logEvent / trackClick / hooks ──► queue.ts ──► PostHog (via /ingest on our domain)
                                                              │
                                                              ▼ HogQL query API (server, cached)
D-day     gate check-ins, booth QR scans,  ──► Supabase ──► src/features/admin/data/adapters.ts ──► /admin
          booth presence (opt-in)                               (+ GET /api/admin/live, 30 s)
```

- **Website engagement** goes to PostHog (US region, one project for every environment). Every
  event carries `app_env`; production `/admin` counts only `app_env = 'production'`.
- **D-day engagement** stays in Supabase: `gate_check_ins`, `booth_scan_events` (QR, awards
  points) and `booth_presence` (opt-in location, never awards points).
- **`/admin`** is admin-only (`src/app/admin/layout.tsx`). Its panels read through one module,
  `adapters.ts`. Without PostHog query credentials the web panels show mock figures and the header
  says "Mock data"; the D-day live section is always real.

| Read next | For |
| --- | --- |
| [01-tracking-library.md](01-tracking-library.md) | `logEvent`, `trackClick`, adding an event |
| [02-posthog-setup.md](02-posthog-setup.md) | Keys, project settings, privacy, the `/ingest` proxy, query limits |
| [03-hooks-cookbook.md](03-hooks-cookbook.md) | Impressions, scroll depth, funnels |
| [04-dashboards-and-data-seam.md](04-dashboards-and-data-seam.md) | Which panel reads what |
| [05-drone.md](05-drone.md) | The drone cube's render telemetry |
| [06-dday-presence.md](06-dday-presence.md) | Booth presence: rules, consent, tuning, retention |
| [99-known-gaps.md](99-known-gaps.md) | What the numbers can't tell you |
