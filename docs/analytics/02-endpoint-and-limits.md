# Endpoint, Batching, and Limits

## POST /api/track

The single ingest endpoint. `src/app/api/track/route.ts`.

```jsonc
// request
{
  "sessionId": "…",
  "device": { "deviceType": "mobile", "browser": "Chrome", "os": "Android" },
  "events": [
    { "name": "sponsor_click", "division": "SP", "pagePath": "/sponsors",
      "ts": 1737200000000, "metadata": { "sponsorId": "telkom", "tier": "platinum" } }
  ]
}
```

```jsonc
{ "accepted": 1 }   // 202
```

| Status | Meaning |
|---|---|
| `202` | Accepted |
| `400` | Malformed JSON, empty batch, batch over 50 events, or no valid events |
| `413` | Body over 32KB |
| `429` | Rate limited — carries `Retry-After` in seconds |

`POST` is never cached by Next, so the route needs no cache config.

There is also **`GET /api/admin/events?limit=N`** for polling the feed while debugging. It's marked
`force-dynamic` — it reads mutable module state and touches no other request-time API, so without
that Next would prerender it at build and serve a frozen empty array forever. The same hazard is why
`RecentEventsPanel` calls `await connection()`.

## Batching

Events accumulate in memory and drain when **any** of these happens:

- 5 seconds elapse (`FLUSH_INTERVAL_MS`)
- the buffer hits 50 events (`MAX_BATCH`)
- the page is backgrounded (`visibilitychange` → hidden, or `pagehide`)

Verified: browsing the landing page produces batches like
`accepted 5 event(s): page_view, funnel_step_enter, web_vital, web_vital, web_vital` — one request,
five events, rather than five requests.

Transport falls back in order: `navigator.sendBeacon` → `fetch(keepalive: true)` → plain `fetch`.
`sendBeacon` needs an explicit `Blob` type or the server sees no content type.

**Deliberately not `beforeunload`.** It's unreliable on mobile Safari and it disqualifies the page
from bfcache.

**One ordering trap, already fixed but worth knowing:** the queue registers its own
`visibilitychange` listener the first time an event is enqueued, which is always *before*
`AnalyticsRoot`'s drop-off effect runs. So on page hide the queue flushes first and any event
emitted by a later listener would sit in the buffer and be lost. `AnalyticsRoot.emitDropoffs()`
therefore calls `flush()` explicitly after enqueuing. Any new page-hide listener that emits events
must do the same.

## Sampling

`SAMPLE_RATES` in `src/lib/analytics/config.ts`:

| Event | Rate |
|---|---|
| `scroll_depth` | 1 in 10 |
| `section_impression` | 1 in 2 |
| everything else | full fidelity |

Clicks and conversions go through `trackClick`, which forces full fidelity regardless.

**Any aggregate over a sampled type must multiply back up by the rate.** These rates are guesses —
they have never been validated against real event-day traffic. See
[99-known-gaps.md](99-known-gaps.md).

## Rate limiting

Fixed-window counter, 30 requests/minute, keyed on a SHA-256 hash of the first `x-forwarded-for` hop
plus user-agent. Next 16 has no `request.ip`. The key is hashed rather than stored raw because an IP
address is PII and this module has no business holding one.

Three caps are enforced, and the batch/body caps matter more than the request count — a batching
client makes few requests, so an attacker's lever is batch size, not frequency.

**Honest limits.** This is in-memory and per-process:

- N serverless instances means N × the intended budget
- resets to zero on every redeploy
- defeated by rotating IPs, or a spoofed `x-forwarded-for` unless the platform overwrites that
  header (Vercel does; bare Node behind nginx may not)

It stops a stuck retry loop and a casual `curl` in a for-loop. It does not stop a determined actor.
The swap point for a real limiter is `check(key)` in `src/lib/analytics/server/rateLimit.ts` — only
the body changes.

## PII handling

`src/lib/analytics/server/validate.ts` is the single chokepoint. Every event passes through it.

- **`user_id` is hardcoded `null`** and is not accepted from the client at all.
- Metadata keys matching `email|mail|name|phone|telp|hp|nim|nik|token|password|secret|address|alamat|birth|dob`
  are dropped silently. `nim` and `nik` are Indonesian student and national ID numbers — both direct
  identifiers, both plausible things to attach to a registration event.
- Nested objects and arrays are dropped outright rather than serialized — we can't inspect inside them.
- Strings truncated to 128 chars, max 20 metadata keys.
- **Query strings are stripped from paths** — they routinely carry emails and tokens.
- Only the parsed `{deviceType, browser, os}` is stored, never the raw user-agent.

Verified end-to-end: posting `email`, `userName`, `nim`, `password`, `phone`, a nested object, and
`?email=…&token=…` in the path stored only `{sponsorId, tier, clicks}` with `page_path: "/sponsors"`.

## Event store

In-memory ring buffer, 500 events, `src/lib/analytics/server/eventStore.ts`. Pinned to a
`Symbol.for` key so Turbopack HMR reattaches to the same buffer instead of clearing the feed on every
file save.

**It backs the Recent Events panel and nothing else.** No dashboard aggregate reads it. It's
per-process and volatile — it proves ingest works end to end; it is not an analytics store.
