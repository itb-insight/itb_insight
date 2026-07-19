# The Drone Cube

`src/features/drone/` — a minimal Three.js cube standing in for the 'drone' component.

## Why it exists

Not for the visual. The point is to have a **real GPU-bound thing to instrument**, so the Engagement
dashboard's load-time numbers reflect actual WebGL behaviour on low-end phones rather than a guess.
WebGL performance varies wildly across devices, and that variance is precisely what distinguishes
"visitors weren't interested" from "it never finished loading".

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

Real TTI is not measurable from userland. Calling this number TTI would misrepresent it on the
dashboard, so it's named `drone_ready_ms` everywhere, and the Engagement panel says so on screen
("Measured mount → first rendered frame, not time-to-interactive").

Genuine LCP / INP / TTFB come from `useReportWebVitals` in `AnalyticsRoot` and land as `web_vital`
events. Use those for page performance; use `drone_ready_ms` for this component specifically.

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
