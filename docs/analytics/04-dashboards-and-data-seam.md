# Dashboard data seam

## Current truth

- `/admin` and `/admin/analytics` are public demo routes.
- Dashboard adapters return mock/non-authoritative KPIs, funnels, sponsor, engagement, and traffic data.
- The recent-events panel is the sole consumer of real runtime data, from the volatile in-memory store.
- The adapter boundary is a future persistence seam, not evidence that analytics data is stored or operationally reportable.

## Future persistence work

Wire validated ingest to a durable approved schema (the existing `analytics_events` migration or a new approved migration), protect administrative reads, and replace mock adapters with query-backed adapters. Establish retention, sampling correction, and aggregate/rollup policy before using figures for decisions or sponsor reporting.

`analytics/schema.sql` remains a reference/proposed design and is not an executed migration; reconcile its fields with the active runtime before adoption.
