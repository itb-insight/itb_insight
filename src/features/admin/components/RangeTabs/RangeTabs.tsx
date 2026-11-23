"use client"

import { RANGE_OPTIONS, type RangeKey } from "@/features/admin/data/timeRange"
import styles from "./RangeTabs.module.css"

export interface TabOption<T extends string> {
  key: T
  label: string
}

interface RangeTabsProps<T extends string> {
  value: T
  onChange: (key: T) => void
  /**
   * Pilihan yang ditampilkan. Tanpa ini dipakai rentang waktu D-Day
   * (30 min sampai 12 jam), jadi pemanggil lama tidak perlu diubah.
   *
   * Dibuat bisa dioper karena Figma memakai komponen "Tab (5 Tabs)" yang sama
   * untuk hal lain: Scan/Point di Keramaian Booth, dan 14 hari/30 hari/Total
   * di grafik Kunjungan.
   */
  options?: readonly TabOption<T>[]
  /** dipakai screen reader, mis. "Rentang waktu grafik gate" */
  label?: string
}

/** Figma "Tab (5 Tabs)": tinggi 40, radius 20, terpilih = pil terang. */
export default function RangeTabs<T extends string = RangeKey>({
  value,
  onChange,
  options,
  label = "Rentang waktu",
}: RangeTabsProps<T>) {
  const daftar = (options ?? (RANGE_OPTIONS as unknown as readonly TabOption<T>[]))

  return (
    <div className={styles.tabs} role="group" aria-label={label}>
      {daftar.map((opt) => (
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
