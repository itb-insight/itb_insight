# Analytics Tooling — Overview

Web analytics for ITB Insight: one event pipeline, tagged by division, feeding an admin dashboard.

**This is an MVP.** All dashboard figures are mock data. There is no database and no authentication.
Read [99-known-gaps.md](99-known-gaps.md) before deploying anything here.

## The shape of it

```
  any page/component
        │  logEvent() / trackClick() / useImpression() / useFunnelStep()
        ▼
  src/lib/analytics/queue.ts        batches in memory, flushes every 5s or on page hide
        │  POST /api/track  (one request, many events)
        ▼
  src/app/api/track/route.ts        rate limit → validate (strips PII) → store
        │
        ▼
  in-memory ring buffer             500 events, per process, volatile
        │
        ▼
  /admin  "Recent Events" panel     ← the ONLY panel reading real data
```

Everything else on `/admin` — KPIs, funnel, sponsor CTR, engagement, traffic — comes from
`src/features/admin/data/mockData.ts` via the adapter seam.

## Divisions

Defined once in `src/lib/analytics/divisions.ts`, which is the source of truth:

| Code | Division |
|---|---|
| `CPT` | Competition |
| `EV` | Event |
| `SP` | Sponsorship |
| `MKT` | Marketing |
| `CB` | Creative Branding |
| `MISC` | Misc — the fallback bucket |

Any event whose type isn't in the `EVENT_DIVISION` map lands in `MISC` rather than being rejected.
That's deliberate: new pages can start emitting events before anyone updates the registry, and the
data still arrives. Tag it properly later; nothing breaks in the meantime.

## Files

| Path | What it is |
|---|---|
| `src/lib/analytics/` | The tracking runtime. Import root for everything reusable. |
| `src/lib/analytics/hooks/` | The drop-in mechanisms — impression, scroll depth, funnel. |
| `src/lib/analytics/server/` | Validation, rate limiting, event store. Server-only. |
| `src/app/api/track/route.ts` | The single ingest endpoint. |
| `src/features/admin/` | Dashboard UI and the mock/real data seam. |
| `src/layouts/AdminShell/` | Sidebar shell. |
| `src/features/drone/` | The Three.js cube and its perf instrumentation. |

## Read next

- [01-tracking-library.md](01-tracking-library.md) — how to log an event
- [03-hooks-cookbook.md](03-hooks-cookbook.md) — copy-paste recipes for the reusable mechanisms
- [02-endpoint-and-limits.md](02-endpoint-and-limits.md) — the endpoint, batching, sampling, PII
- [04-dashboards-and-data-seam.md](04-dashboards-and-data-seam.md) — swapping mocks for a database
- [05-drone.md](05-drone.md) — the 3D cube
- [99-known-gaps.md](99-known-gaps.md) — **what is not done**
- [schema.sql](schema.sql) — reference DDL, not executed by anything
