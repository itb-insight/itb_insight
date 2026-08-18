# The Drone Cube

> Its telemetry currently enters the volatile analytics pipeline and must not be treated as a
> durable operational metric; see [00-overview.md](00-overview.md).

`src/features/drone/` — a minimal Three.js cube standing in for the 'drone' component.

## Why it exists

Not for the visual. The point is to have a **real GPU-bound thing to instrument**. The component
emits actual WebGL timing telemetry, but the current Engagement dashboard still displays mock,
non-authoritative values and does not aggregate this telemetry. Once durable ingestion and real-data
adapters exist, device variance can help distinguish low interest from a component that never loaded.

## Usage

```tsx
import DroneMount from "@/features/drone/DroneMount"

<DroneMount componentId="drone-timeline" label="drone" />
```

Always mount via `DroneMount`, never `DroneCube` directly. `DroneMount` uses `next/dynamic` with
`ssr: false` — `three` is ~600KB and `DroneCube` touches `document` and WebGL on mount, so it must
stay out of the server render and the initial bundle. The loading placeholder reserves the same box
to avoid a layout shift.

Live at `src/features/landing/components/TimelineSection/TimelineSection.tsx`.

## What it measures

```ts
useDronePerf({ componentId }) → { onFirstFrame, onContextLost }
```

Emits `drone_ready` with `readyMs` — **mount to first rendered frame**.

### This is not time-to-interactive

Real TTI is not measurable from userland. Calling this number TTI would misrepresent it, so the
event field is named `drone_ready_ms`. The current Engagement panel is mock-backed; any future
real-data adapter must label this value as mount-to-first-frame rather than time-to-interactive.

Genuine LCP / INP / TTFB come from `useReportWebVitals` in `AnalyticsRoot` and land as `web_vital`
events. They and `drone_ready_ms` currently enter only the volatile event pipeline; neither is a
durable dashboard metric yet.

`drone_context_lost` fires if the WebGL context is lost or never obtainable — on a device with no
WebGL the component degrades quietly rather than throwing.

Measured locally: `readyMs` around 58–67ms in headless Chrome with software rendering. Real low-end
mobile will be far worse, which is the entire point of collecting it.

## Implementation notes

- **Disposes geometry, materials, *and* the renderer** on unmount. Skipping `renderer.dispose()`
  leaks GPU memory across route changes.
- **Respects `prefers-reduced-motion`** — renders exactly one frame and stops the rAF loop rather
  than spinning.
- **Caps device pixel ratio at 2.** Retina phones are exactly the low-end devices you don't want to
  hand a 3× framebuffer.
- Dark edge lines keep the cube legible against the greyscale background, where a flat-lit face can
  otherwise vanish into the card.
- Also wrapped in `useImpression` (division `CB`), so you can tell "never scrolled to it" apart from
  "saw it but it didn't load".

## Turbopack

**Never add a `webpack` key to `next.config.ts`.** Turbopack is the default builder in Next 16 and a
`webpack` key fails the build. Three.js integration guides commonly suggest one — ignore that advice
here. The current setup needs no bundler configuration at all.
