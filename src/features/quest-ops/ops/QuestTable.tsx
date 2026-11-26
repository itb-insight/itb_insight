"use client"

import { useState } from "react"

import { formatCount } from "../format"
import type { QuestRow } from "../types"
import styles from "./QuestOps.module.css"

interface QuestTableProps {
  quests: QuestRow[]
  onToggleState: (code: string) => void
}

export default function QuestTable({ quests, onToggleState }: QuestTableProps) {
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()
  const rows = q
    ? quests.filter((r) => [r.code, r.name, r.owner].some((v) => v.toLowerCase().includes(q)))
    : quests

  return (
    <section className={styles.panel} aria-labelledby="quests-title">
      <div className={styles.tableHead}>
        <h2 id="quests-title" className={`${styles.panelTitle} ${styles.panelTitleSmall}`}>
          Quests &amp; rewards
        </h2>
        <label className={styles.search}>
          Search
          <input
            type="search"
            className={`${styles.input} ${styles.searchInput}`}
            placeholder="ID, name, owner"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">NAME</th>
              <th scope="col">OWNER</th>
              <th scope="col">VERIFY</th>
              <th scope="col">PTS</th>
              <th scope="col">DONE</th>
              <th scope="col">FLAGS</th>
              <th scope="col">STATE</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.code}>
                <td>{r.code}</td>
                <td>{r.name}</td>
                <td className={styles.cellSoft}>{r.owner}</td>
                <td className={styles.cellSoft}>{r.verify}</td>
                <td>{r.points}</td>
                <td>{formatCount(r.done)}</td>
                <td className={r.flag ? styles.flag : undefined}>{r.flag ?? "-"}</td>
                <td>
                  <button
                    type="button"
                    className={`${styles.badge} ${r.state === "live" ? styles.badgeLive : styles.badgePaused}`}
                    aria-label={`${r.code}: ${r.state === "live" ? "LIVE, klik untuk pause" : "PAUSE, klik untuk aktifkan"}`}
                    onClick={() => onToggleState(r.code)}
                  >
                    {r.state === "live" ? "LIVE" : "PAUSE"}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className={styles.empty}>
                  Tidak ada quest yang cocok dengan “{query}”
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
