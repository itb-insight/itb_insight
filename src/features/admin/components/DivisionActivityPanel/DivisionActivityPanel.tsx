"use client"

import { useState } from "react"
import { DIVISIONS, DIVISION_CHART_VAR } from "@/lib/analytics/divisions"
import type { DivisionActivityDto } from "../../data/types"
import BarRow from "../charts/BarRow"
import Panel from "../Panel/Panel"
import styles from "./DivisionActivityPanel.module.css"

interface DivisionActivityPanelProps {
  data: DivisionActivityDto[]
  total: number
}

/**
 * Today's activity per division.
 *
 * Rendered as one bar per division rather than a single stacked bar. On a
 * greyscale palette a 6-segment stack is unreadable — the neutral ramp has no
 * chroma to separate categories, so adjacent segments are only distinguishable
 * by lightness, which fails at small widths. One row per division is a single
 * series: no ramp needed, no legend needed, and it answers "which division is
 * busiest?" directly, which is the actual question this panel exists for.
 *
 * The table view is not a fallback — it is the precise read, and it is one
 * click away rather than hidden behind a hover tooltip.
 */
export default function DivisionActivityPanel({ data, total }: DivisionActivityPanelProps) {
  const [showTable, setShowTable] = useState(false)

  // Sorted by volume so the ranking is the layout, not something to decode.
  const sorted = [...data].sort((a, b) => b.events - a.events)
  const max = Math.max(...sorted.map((d) => d.events), 1)

  return (
    <Panel
      title="Today's Activity by Division"
      subtitle={`${total.toLocaleString()} events logged today`}
      full
      action={
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setShowTable((current) => !current)}
          aria-pressed={showTable}
        >
          {showTable ? "Show chart" : "Show table"}
        </button>
      }
    >
      {showTable ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Division</th>
              <th scope="col">Code</th>
              <th scope="col" className={styles.numeric}>Events</th>
              <th scope="col" className={styles.numeric}>Share</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.division}>
                <td>{DIVISIONS[row.division]}</td>
                <td className={styles.code}>{row.division}</td>
                <td className={styles.numeric}>{row.events.toLocaleString()}</td>
                <td className={styles.numeric}>{row.share_pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className={styles.rows}>
          {sorted.map((row) => (
            <BarRow
              key={row.division}
              // The division code is the identity key, not the bar's shade.
              label={`${row.division} — ${DIVISIONS[row.division]}`}
              value={`${row.events.toLocaleString()} (${row.share_pct}%)`}
              pct={(row.events / max) * 100}
              fillVar={DIVISION_CHART_VAR[row.division]}
            />
          ))}
        </div>
      )}
    </Panel>
  )
}
