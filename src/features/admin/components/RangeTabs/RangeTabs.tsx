"use client"

import { RANGE_OPTIONS, type RangeKey } from "@/features/admin/data/timeRange"
import styles from "./RangeTabs.module.css"

interface RangeTabsProps {
  value: RangeKey
  onChange: (key: RangeKey) => void
  /** dipakai screen reader, mis. "Rentang waktu grafik gate" */
  label?: string
}

/** Pilihan rentang 30 min | 1 jam | 2 jam | 5 jam | 12 jam (Figma "Tab (5 Tabs)"). */
export default function RangeTabs({ value, onChange, label = "Rentang waktu" }: RangeTabsProps) {
  return (
    <div className={styles.tabs} role="group" aria-label={label}>
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          className={`${styles.tab} ${opt.key === value ? styles.active : ""}`}
          aria-pressed={opt.key === value}
          onClick={() => onChange(opt.key)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
