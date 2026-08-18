# Tracking Library

> Current endpoint delivery is volatile: events accepted by `POST /api/track` go to an in-memory
> store, not to the `analytics_events` table. Dashboard metrics are mock/non-authoritative. See
> [00-overview.md](00-overview.md).

One primitive, two convenience wrappers. Import root is `@/lib/analytics/*`. No barrel files —
import the module you need directly.

## logEvent

```ts
import logEvent from "@/lib/analytics/logEvent"

logEvent("sponsor_click", { sponsorId: "telkom", tier: "platinum" })
logEvent("scroll_depth", { depth: 50 })
logEvent("custom_thing", { foo: 1 }, { division: "CB", force: true })
```

```ts
logEvent(
  name: EventName,
  metadata?: EventMetadata,
  options?: { division?: DivisionTag; force?: boolean }
): void
```

- **Fire-and-forget.** Returns `void`, never throws, no-ops during server rendering. Safe to call
  from anywhere without a guard.
- **`division`** overrides the registry lookup for this call. Omit it and the event's type decides;
  unregistered types get `MISC`.
- **`force`** bypasses sampling. Use it for anything you must not undercount.

### EventMetadata is intentionally restrictive

```ts
type EventMetadata = Record<string, string | number | boolean | null>
```

Flat, primitives only — *not* `Record<string, unknown>`. Nested objects are how PII usually ends up
in an events table, so passing one is a type error. The server re-validates regardless; see
[02-endpoint-and-limits.md](02-endpoint-and-limits.md).

## trackClick

```ts
import trackClick from "@/lib/analytics/trackClick"

<button onClick={() => trackClick("sponsor_click", { sponsorId, tier })}>
```

Identical to `logEvent` with `force: true` baked in. It exists so no call site has to *remember*
that clicks and conversions must never be sampled — forgetting `force` on a `logEvent` call would
quietly undercount conversions by the sampling rate, and that's a bug you notice a month later when
the numbers don't reconcile.

**Rule of thumb:** clicks and conversions → `trackClick`. Passive signals → `logEvent`.

## Adding a new event type

1. Add the name to `KnownEventName` in `src/lib/analytics/types.ts` (optional — any string works,
   this just buys autocomplete).
2. Map it to a division in `EVENT_DIVISION` in `src/lib/analytics/divisions.ts`. Skip this and it
   lands in `MISC`, which is a valid choice for genuinely cross-cutting events.
3. If it's high-volume, add a sample rate in `src/lib/analytics/config.ts`.

No endpoint change, no schema change, no dashboard change. That's the point of a generic logger.

## Session identity

`getSessionId()` returns an anonymous id from `sessionStorage` — not `localStorage`, so closing the
tab ends the identity and it never becomes a persistent cross-visit identifier. `user_id` is
hardcoded `null` server-side and is not accepted from the client at all.

Never call `getSessionId()` during render — `sessionStorage` doesn't exist on the server and you'll
get a hydration mismatch. Effects only.
