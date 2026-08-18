# Analytics overview

**Current limited capability:** the client tracking library posts batches to `POST /api/track`; the route validates them and appends them to a 500-event, per-process in-memory ring buffer. This buffer is volatile and feeds only the demo recent-events feed.

```text
client tracking helpers -> POST /api/track -> validation/rate limit -> in-memory event store
                                                                  -> GET /api/admin/events
```

- `/admin` is public demo/mock state, not a protected analytics console.
- Dashboard KPIs, funnels, traffic, sponsor, and engagement figures are mock/non-authoritative.
- Migration `0006_analytics_events.sql` creates a persistent `analytics_events` table, but active ingest does **not** write to it.
- [schema.sql](schema.sql) is reference/proposed SQL only; it is not an executed migration.
- PostHog is a final PRD Should integration target, not installed or configured today. Durable analytics is a target design and requires privacy, retention, authorization, and reliable persistence decisions.

Read [02-endpoint-and-limits.md](02-endpoint-and-limits.md) for the live endpoint, [04-dashboards-and-data-seam.md](04-dashboards-and-data-seam.md) for mock metrics, and [99-known-gaps.md](99-known-gaps.md) before operational use.
