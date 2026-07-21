# Dashboards and the Data Seam

## Routes

| Route | State |
|---|---|
| `/admin` | Cross-division overview — KPIs, division activity, funnel, sponsors, engagement, traffic, live feed |
| `/admin/analytics` | The three spec dashboards in detail: Sponsor, Funnel, Engagement |
| `/admin/{users,events,competition,content,partners,settings}` | Placeholder — sidebar fidelity only |

`/admin` has **no authentication**. `robots: noindex` is set as a floor, not a control.

## The seam

`src/features/admin/data/adapters.ts` is **the only module a dashboard component may import for
data**. No panel imports `mockData.ts` directly. That single rule is what keeps swapping to a real
database a small diff instead of a rewrite of the panel tree.

```ts
getKpis(range)             → KpiDto[]
getDivisionActivity(range) → DivisionActivityDto[]
getFunnel(range)           → FunnelDto
getSponsorStats(range)     → SponsorStatDto[]
getEngagement(range)       → EngagementDto
getTraffic(range)          → TrafficDto
getRecentEvents(limit)     → RecentEventDto[]
```

Three conventions make the swap cheap:

1. **Every adapter is already `async`**, even the ones returning a literal. Call sites already
   `await` inside Server Components, so adding `await db.query(...)` changes nothing above the seam.
2. **DTO field names mirror the SQL columns exactly** (`src/features/admin/data/types.ts` vs
   [schema.sql](schema.sql)), including the `sponsor_stats` view. `getSponsorStats` becomes close to
   a literal `SELECT * FROM sponsor_stats`. No mapping layer to write later.
3. **The seam doesn't distinguish "mock" from "live", only "above" from "below".**
   `getRecentEvents` already reads real state and has the same shape as the rest.

`range` is accepted and currently ignored by the mock adapters. It's in the signature now so a date
picker can be added later without touching a single call site.

### Migrating one panel to real data

Change the body of its adapter. That's the whole change.

```ts
export async function getSponsorStats(range: DateRange): Promise<SponsorStatDto[]> {
  const { rows } = await db.query(
    "SELECT * FROM sponsor_stats ORDER BY ctr_percent DESC"
  )
  return rows
}
```

Build the dashboard queries as **materialized views or scheduled rollups**, not live `COUNT()` over
raw events. Event-day traffic spikes, and you don't want admin queries competing with the site for
database resources. `sponsor_stats` in [schema.sql](schema.sql) shows the pattern.

## Design notes

### Why there's no stacked division bar

The reference mock used a single 6-segment stacked bar. Validated against the actual card surface
(`#242424`), six neutral series come back at **chroma 0 with a worst adjacent ΔE of 9.0** — well
below the ~15 needed for categorical use. On a greyscale palette, adjacent segments in a stack are
distinguishable only by lightness, which collapses at small widths.

So the panel is **one bar per division, sorted by volume**. That's a single series: no ramp doing
work it can't do, no legend to decode, and it answers "which division is busiest today?" more
directly than a stack does. The **table toggle** is not a fallback — it's the precise read, one
click away rather than hidden behind a hover tooltip.

### Series identity

`--chart-1` … `--chart-6` in `globals.css` are an **ordinal** ramp. The division **code** in the
label is the identity key; the shade is only a hint. Assignment lives in
`src/lib/analytics/divisions.ts` (`DIVISION_CHART_VAR`) and must **never be reordered by value** —
filtering must not repaint the surviving series.

### Encoding rules used throughout

Because greyscale has no colour to spare:

- KPI trend direction → icon + screen-reader word, never colour
- Alert severity → icon + the word "Warning", never colour
- Sponsor tier → text label, never a coloured dot
- Gauge health → a text rating ("Healthy"/"Degraded"/"Poor") beside the number
- Active nav and filter states → background + border + weight, never colour alone
- CTR (a rate) and impressions (a count) → two table columns, never two y-axes

### The division filter

Sits in one row above every panel it affects — never per-panel, never inside a card. Panels are
matched by their `data-divisions` attribute rather than React state, which keeps every panel a
server component.

Dimming alone would drop non-matching panels below readable contrast, so dimmed panels are also
marked `inert` (removing them from tab order and the accessibility tree) and the active filter is
named in a visible chip.

### Caching

`RecentEventsPanel` is isolated as its own server component with `await connection()` and wrapped in
`<Suspense>`. Without `connection()` Next would prerender it and serve a frozen empty list; isolating
it keeps the surrounding mock-driven panels static. `/admin` shows as dynamic in the build output for
exactly this reason.
