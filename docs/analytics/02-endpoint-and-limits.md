# Endpoint and limits

## Active endpoint: `POST /api/track`

The route validates JSON batches, rejects malformed/oversize/rate-limited input, appends accepted events to the in-memory store, and returns `202` with `{ "accepted": number }`. It does **not** persist to Supabase, despite the `analytics_events` migration.

The companion `GET /api/admin/events?limit=N` returns recent events from the same process-local buffer and is public demo behavior.

## Current limits

- Maximum request body: 32 KB.
- Maximum batch: 50 events.
- In-memory fixed-window rate limit: 30 requests/minute per hashed client key.
- Ring buffer: 500 events, cleared by restart/redeploy and fragmented across instances.

The route strips query strings and filters PII-like metadata keys. It accepts anonymous sessions and sets stored `user_id` to `null`. These controls are not a substitute for durable storage, global rate limiting, or a protected admin surface.

## Client behavior

The queue batches in the browser and flushes by interval, capacity, or page hide. Sampling applies to passive events; any future aggregate must account for its sample rate. See [01-tracking-library.md](01-tracking-library.md).
