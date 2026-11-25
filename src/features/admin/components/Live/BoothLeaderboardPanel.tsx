"use client"

import Link from "next/link"
import { useState } from "react"

import type { BoothLiveDto } from "../../data/types"
import InlineBar from "../charts/InlineBar"
import Panel from "../Panel/Panel"
import { dwell } from "./format"
import styles from "./Live.module.css"

type SortKey = "visits" | "scans" | "median_dwell_s"

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "visits", label: "Visits ≥ 5 min" },
  { key: "scans", label: "QR scans" },
  { key: "median_dwell_s", label: "Median dwell" },
]

interface BoothLeaderboardPanelProps {
  booths: BoothLiveDto[]
  /** Show only the top N, with a link to the full list. */
  limit?: number
  full?: boolean
}

export default function BoothLeaderboardPanel({ booths, limit, full }: BoothLeaderboardPanelProps) {
  const [sortKey, setSortKey] = useState<SortKey>("visits")

  // Nulls (no qualifying visit yet) sort last; ties fall back to scans, then name.
  const sorted = [...booths].sort(
    (a, b) =>
      (b[sortKey] ?? -1) - (a[sortKey] ?? -1) || b.scans - a.scans || a.name.localeCompare(b.name),
  )
  const shown = limit ? sorted.slice(0, limit) : sorted
  const maxValue = Math.max(1, ...shown.map((booth) => booth[sortKey] ?? 0))

  return (
    <Panel
      title="Booth Leaderboard"
      subtitle="Today. Visits and dwell from opted-in presence; scans from QR."
      full={full}
      action={
        limit && booths.length > limit ? (
          <Link href="/admin/analytics#booths" className={styles.action}>
            All {booths.length} booths
          </Link>
        ) : undefined
      }
    >
      {booths.length === 0 ? (
        <p className={styles.empty}>No active booths.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Booth</th>
                {COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={styles.numeric}
                    aria-sort={sortKey === column.key ? "descending" : "none"}
                  >
                    <button type="button" className={styles.sort} onClick={() => setSortKey(column.key)}>
                      {column.label}
                      {sortKey === column.key ? " ↓" : ""}
                    </button>
                  </th>
                ))}
                <th scope="col" className={styles.numeric}>
                  Visitors
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((booth) => (
                <tr key={booth.booth_id}>
                  <td className={styles.name}>{booth.name}</td>
                  <td className={styles.numeric}>
                    {booth.visits.toLocaleString()}
                    {sortKey === "visits" && <InlineBar pct={(booth.visits / maxValue) * 100} />}
                  </td>
                  <td className={styles.numeric}>
                    {booth.scans.toLocaleString()}
                    {sortKey === "scans" && <InlineBar pct={(booth.scans / maxValue) * 100} />}
                  </td>
                  <td className={styles.numeric} title={`Average ${dwell(booth.avg_dwell_s)}`}>
                    {dwell(booth.median_dwell_s)}
                    {sortKey === "median_dwell_s" && (
                      <InlineBar pct={((booth.median_dwell_s ?? 0) / maxValue) * 100} />
                    )}
                  </td>
                  <td className={styles.numeric}>{booth.visitors.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}
