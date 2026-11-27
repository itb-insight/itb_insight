"use client"

import { useState } from "react"

import { FilterChips, GlassPanel } from "@/shared/components/GlassTable"
import type { ChipOption } from "@/shared/components/GlassTable"
import tableStyles from "@/shared/components/GlassTable/GlassTable.module.css"
import type { StaffLocationKind, StaffScanGroup } from "./types"
import styles from "./StaffScanTable.module.css"

type LocationFilter = "all" | StaffLocationKind

const FILTER_OPTIONS: ChipOption<LocationFilter>[] = [
  { value: "all", label: "Semua lokasi" },
  { value: "gate", label: "Gate" },
  { value: "booth", label: "Booth" },
]

const numberFormat = new Intl.NumberFormat("id-ID")

interface StaffScanTableProps {
  groups: StaffScanGroup[]
  title?: string
  subtitle?: string
}

export default function StaffScanTable({
  groups,
  title = "Siapa staff yang scan?",
  subtitle = "Tabel total scan dan points yang diberikan staff",
}: StaffScanTableProps) {
  const [filter, setFilter] = useState<LocationFilter>("all")
  const visible = filter === "all" ? groups : groups.filter((group) => group.kind === filter)

  return (
    <GlassPanel
      title={title}
      subtitle={subtitle}
      action={
        <FilterChips
          options={FILTER_OPTIONS}
          value={filter}
          onChange={setFilter}
          ariaLabel="Filter lokasi"
        />
      }
    >
      <table className={`${tableStyles.table} ${styles.table}`}>
        <colgroup>
          <col style={{ width: "18.1%" }} />
          <col style={{ width: "17.5%" }} />
          <col style={{ width: "16.95%" }} />
          <col style={{ width: "26.4%" }} />
          <col style={{ width: "21.05%" }} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Nama</th>
            <th scope="col">Peran</th>
            <th scope="col" className={tableStyles.num}>Total Scan</th>
            <th scope="col" className={tableStyles.num}>Total points diberikan</th>
            <th scope="col" className={tableStyles.num}>Scan Terakhir</th>
          </tr>
        </thead>
        {visible.length === 0 ? (
          <tbody>
            <tr>
              <td colSpan={5} className={tableStyles.empty}>Belum ada data scan.</td>
            </tr>
          </tbody>
        ) : (
          visible.map((group) => (
            <tbody key={group.id}>
              <tr className={styles.groupRow}>
                <th scope="rowgroup" colSpan={2}>{group.label}</th>
                <td className={tableStyles.num}>{numberFormat.format(group.totalScan)}</td>
                <td className={tableStyles.num}>{numberFormat.format(group.totalPoints)}</td>
                <td />
              </tr>
              {group.staff.map((person) => (
                <tr key={person.id}>
                  <td>{person.name}</td>
                  <td>{person.role}</td>
                  <td className={tableStyles.num}>{numberFormat.format(person.totalScan)}</td>
                  <td className={tableStyles.num}>{numberFormat.format(person.totalPoints)}</td>
                  <td className={tableStyles.num}>{person.lastScan ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          ))
        )}
      </table>
    </GlassPanel>
  )
}
