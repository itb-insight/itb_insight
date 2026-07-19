import type { DivisionTag } from "./divisions"

/**
 * Session-scoped journal of funnel progress.
 *
 * This is what makes drop-off a DERIVED signal rather than something each page
 * has to hand-instrument. useFunnelStep writes a record here on mount; a single
 * listener in AnalyticsRoot reads the journal on pagehide and emits one
 * funnel_dropoff per funnel that never reached its terminal step.
 *
 * Any future funnel gets drop-off tracking for free by calling useFunnelStep
 * with a new funnelId — no new listener, no new endpoint, no new event type.
 */

const JOURNAL_KEY = "itb_analytics_funnels"

export interface FunnelRecord {
  funnelId: string
  step: string
  stepIndex: number
  division: DivisionTag
  enteredAt: number
  completed: boolean
}

type Journal = Record<string, FunnelRecord>

function read(): Journal {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.sessionStorage.getItem(JOURNAL_KEY)
    return raw ? (JSON.parse(raw) as Journal) : {}
  } catch {
    return {}
  }
}

function write(journal: Journal): void {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(JOURNAL_KEY, JSON.stringify(journal))
  } catch {
    // Storage full or disabled — drop-off detection degrades, tracking does not break.
  }
}

/**
 * Records progress. Only ever moves forward: revisiting an earlier step of a
 * funnel does not overwrite a further one, so "highest step reached" stays
 * accurate even if the visitor navigates backwards.
 */
export function recordStep(record: FunnelRecord): void {
  const journal = read()
  const existing = journal[record.funnelId]

  if (existing && existing.stepIndex > record.stepIndex) {
    journal[record.funnelId] = { ...existing, completed: existing.completed || record.completed }
  } else {
    journal[record.funnelId] = {
      ...record,
      enteredAt: existing?.enteredAt ?? record.enteredAt,
      completed: existing?.completed || record.completed,
    }
  }

  write(journal)
}

export function markCompleted(funnelId: string): void {
  const journal = read()
  const existing = journal[funnelId]
  if (!existing) return
  journal[funnelId] = { ...existing, completed: true }
  write(journal)
}

export function drainAbandoned(): FunnelRecord[] {
  const journal = read()
  const abandoned = Object.values(journal).filter((record) => !record.completed)

  // Clear so a bfcache restore does not re-emit the same drop-offs.
  write({})

  return abandoned
}
