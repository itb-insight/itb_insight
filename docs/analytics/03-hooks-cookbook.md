# Hooks Cookbook

The reusable mechanisms. These are the "template-ish" pieces — designed to be dropped into any
page that doesn't exist yet, without touching the endpoint, the schema, or the dashboard.

Each mechanism ships as **both a hook and a component**. The component is the on-ramp; the hook is
the escape hatch when you need the ref on an element you already control.

---

## Impressions — did anyone actually see it?

### The easy way

```tsx
import TrackedSection from "@/lib/analytics/components/TrackedSection"

<TrackedSection sectionId="sponsors-gold" division="SP" eventName="sponsor_impression">
  {/* anything */}
</TrackedSection>
```

`TrackedSection` is a client component but accepts **server-rendered children**, so wrapping a
server component in it does not force the whole subtree to the client. See
`src/features/landing/components/MediaPartnersSection/MediaPartnersSection.tsx` for a live example
that stays a server component.

### The hook

```tsx
import useImpression from "@/lib/analytics/hooks/useImpression"

const ref = useImpression({ sectionId: "sponsors-gold", division: "SP" })
return <section ref={ref}>…</section>
```

```ts
useImpression(options: {
  sectionId: string        // stable id, also the dedupe key
  division?: DivisionTag
  eventName?: EventName    // default "section_impression"
  threshold?: number       // visible fraction required. default 0.5
  minVisibleMs?: number    // dwell gate before it counts. default 0
  once?: boolean           // default true
  metadata?: EventMetadata
}): (node: Element | null) => void
```

Returns a **ref callback**, not a ref object — it composes onto any element with no ceremony,
survives conditional remounts, and unobserves deterministically when the node detaches.

**Use `minVisibleMs` for sponsor reporting.** A logo that flickers past during a fast scroll is not
an impression you want to bill anyone for. The media partners section uses `1000`.

---

## Clicks

```tsx
import trackClick from "@/lib/analytics/trackClick"

<button onClick={() => trackClick("sponsor_click", { sponsorId, tier })}>
```

Pair impressions and clicks on the same `sponsorId` and CTR falls out of the join. Sponsors want
proof of value, so log both — see `sponsor_stats` in [schema.sql](schema.sql).

---

## Scroll depth

```tsx
import useScrollDepth from "@/lib/analytics/hooks/useScrollDepth"

useScrollDepth({ division: "CB" })
```

```ts
useScrollDepth(options?: {
  sectionId?: string     // defaults to the current pathname
  thresholds?: number[]  // default [25, 50, 75, 100]. Empty array = disabled
  division?: DivisionTag
}): void
```

Fires once per threshold per page view. rAF-throttled, and sampled 1-in-10 at the queue — **any
aggregate over `scroll_depth` must scale by the sample rate.**

---

## Funnels and drop-off

```tsx
import useFunnelStep from "@/lib/analytics/hooks/useFunnelStep"

const { complete } = useFunnelStep({
  funnelId: "hackathon-insight",
  step: "reg_started",
  stepIndex: 1,
  division: "CPT",
})

<button onClick={() => complete()}>Submit</button>
```

```ts
useFunnelStep(options: {
  funnelId: string       // groups steps into one funnel
  step: string           // human-readable step name
  stepIndex: number      // 0-based ordering
  division?: DivisionTag // default "CPT"
  autoEnter?: boolean    // emit funnel_step_enter on mount. default true
  metadata?: EventMetadata
}): {
  complete: (metadata?: EventMetadata) => void
  abandon: (reason?: string) => void
}
```

### Why drop-off needs no per-page work

This is the part worth understanding, because it's what makes the mechanism a template:

1. On mount, the hook writes `{funnelId, step, stepIndex, enteredAt}` into a `sessionStorage`
   journal (`src/lib/analytics/funnelJournal.ts`).
2. The journal only ever moves **forward** — navigating back to an earlier step doesn't overwrite a
   further one, so "highest step reached" stays accurate.
3. On page hide, **a single listener in `AnalyticsRoot`** drains the journal and emits one
   `funnel_dropoff` per funnel that never reached its terminal step, with `lastStep`,
   `lastStepIndex`, and `dwellMs`.

Drop-off is **derived**, not hand-instrumented. A brand-new funnel on a page nobody has written yet
gets drop-off tracking for free by calling the hook with a new `funnelId` — no new listener, no new
event type, no endpoint change.

Call `complete()` on the **terminal** step to mark the funnel finished. Intermediate steps just
mount and unmount. Use `abandon(reason)` only for an *explicit* abandonment you can observe, like a
cancel button — implicit abandonment is already covered.

Live example: `src/features/auth/SignUp/SignUp.tsx`.

---

## Gotchas

**StrictMode double-fires.** React dev mode invokes effects twice, so without a guard every
impression and funnel entry counts 2×. The hooks use a module-level dedupe set (`alreadySeen()` in
`queue.ts`). If you write a new hook that fires on mount, use it.

**Never log form values.** `complete()` takes optional metadata; do not put field contents in it.
The server strips keys matching `email|name|phone|nim|nik|token|password|address` and drops nested
objects, but the first line of defence is not sending them.

**Sampled events are undercounted by design.** Check `SAMPLE_RATES` in
`src/lib/analytics/config.ts` before doing arithmetic on an event type.
