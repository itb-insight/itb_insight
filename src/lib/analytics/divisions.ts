/**
 * Division registry — the single source of truth for division codes, labels,
 * and chart slots. Adding a division here is the only edit needed; everything
 * downstream (legends, filters, tables) reads from this map.
 */

export const DIVISIONS = {
  CPT: "Competition",
  EV: "Event",
  SP: "Sponsorship",
  MKT: "Marketing",
  CB: "Creative Branding",
  MISC: "Misc",
} as const

export type DivisionTag = keyof typeof DIVISIONS

export const DIVISION_ORDER: DivisionTag[] = ["CPT", "EV", "SP", "MKT", "CB", "MISC"]

/**
 * Fixed chart-slot assignment. Never reorder these by value — filtering the
 * dashboard must not repaint the surviving series. The ramp is ordinal, so it
 * carries no categorical meaning on its own; the division code in the legend
 * is the real identity key.
 */
export const DIVISION_CHART_VAR: Record<DivisionTag, string> = {
  CPT: "var(--chart-1)",
  EV: "var(--chart-2)",
  SP: "var(--chart-3)",
  MKT: "var(--chart-4)",
  CB: "var(--chart-5)",
  MISC: "var(--chart-6)",
}

/**
 * Default division for each event type. A call site can always override via
 * logEvent's `division` option; anything unregistered falls through to MISC,
 * which is what makes this map safe to extend as new pages land.
 */
export const EVENT_DIVISION: Record<string, DivisionTag> = {
  page_view: "MKT",
  section_impression: "MKT",
  scroll_depth: "MISC",
  web_vital: "MISC",

  sponsor_impression: "SP",
  sponsor_click: "SP",

  reg_started: "CPT",
  reg_completed: "CPT",
  funnel_step_enter: "CPT",
  funnel_step_complete: "CPT",
  funnel_dropoff: "CPT",

  qr_checkin: "EV",

  drone_ready: "CB",
  drone_context_lost: "CB",
}

export function resolveDivision(name: string, override?: DivisionTag): DivisionTag {
  return override ?? EVENT_DIVISION[name] ?? "MISC"
}

export function isDivisionTag(value: string): value is DivisionTag {
  return value in DIVISIONS
}
