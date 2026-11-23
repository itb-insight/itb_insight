"use client"

import { useMemo, useState } from "react"

import {
  FilterChips,
  GlassPanel,
  StatusBadge,
  type ChipOption,
  type StatusTone,
} from "@/shared/components/GlassTable"
import tableStyles from "@/shared/components/GlassTable/GlassTable.module.css"
import type { FinalisRow, FinalisStatus } from "./types"
import styles from "./FinalisTable.module.css"

type Saringan = "all" | "incomplete"

const FILTER_OPTIONS: ChipOption<Saringan>[] = [
  { value: "all", label: "Semua" },
  { value: "incomplete", label: "Belum lengkap" },
]

/*
  Status dihitung dari anggotanya, tidak disimpan.

  Kalau disimpan sebagai kolom sendiri, dia bisa bertentangan dengan daftar
  anggota di sebelahnya — mis. berlabel "Lengkap" padahal ada yang "belum".
*/
function statusTim(row: FinalisRow): FinalisStatus {
  const hadir = row.members.filter((m) => m.checkedInAt).length
  if (hadir === 0) return "belum"
  return hadir === row.members.length ? "lengkap" : "sebagian"
}

const STATUS: Record<FinalisStatus, { label: string; tone: StatusTone }> = {
  lengkap: { label: "Lengkap", tone: "success" },
  sebagian: { label: "Sebagian", tone: "warning" },
  belum: { label: "Belum hadir", tone: "neutral" },
}

const tanggal = (v: string | Date) => {
  const d = v instanceof Date ? v : new Date(v)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

interface FinalisTableProps {
  rows: FinalisRow[]
  title?: string
  subtitle?: string
}

/**
 * Kehadiran finalis di hari-H — Figma node 1932:2391.
 *
 * Memakai GlassPanel / FilterChips / StatusBadge yang sama dengan
 * TeamRegistrationTable, karena keduanya bersebelahan di halaman /admin/user —
 * lencana dengan bentuk atau warna yang beda tipis akan langsung terlihat.
 *
 * Latar lencana di dump memang sudah sama persis dengan StatusBadge
 * (#1B3B47 / #383634 / #1F3048); yang berbeda cuma warna teksnya beberapa
 * digit, dan itu diabaikan demi seragam dengan tabel tetangganya.
 */
export default function FinalisTable({
  rows,
  title = "Apakah para finalis hadir di hari-H",
  /* Dump menulis "dibandung"; jelas salah ketik dari "dibanding". */
  subtitle = "Tim finalis yang sudah check-in dibanding yang diharapkan",
}: FinalisTableProps) {
  const [filter, setFilter] = useState<Saringan>("all")

  const terlihat = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => statusTim(r) !== "lengkap")),
    [rows, filter],
  )

  return (
    <GlassPanel
      title={title}
      subtitle={subtitle}
      action={
        <FilterChips
          options={FILTER_OPTIONS}
          value={filter}
          onChange={setFilter}
          ariaLabel="Saring kehadiran finalis"
        />
      }
    >
      <table className={`${tableStyles.table} ${styles.table}`}>
        <colgroup>
          <col style={{ width: "4.1%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "14.6%" }} />
          <col style={{ width: "34.5%" }} />
          <col style={{ width: "17.8%" }} />
          <col style={{ width: "11%" }} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Comp / Event</th>
            <th scope="col">Nama tim</th>
            <th scope="col">Anggota dan jam check-in</th>
            <th scope="col">Status</th>
            <th scope="col">Daftar pada</th>
          </tr>
        </thead>

        <tbody>
          {terlihat.length === 0 ? (
            <tr>
              <td className={tableStyles.empty} colSpan={6}>
                Tidak ada tim yang cocok.
              </td>
            </tr>
          ) : (
            terlihat.map((row) => {
              const s = STATUS[statusTim(row)]
              return (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.compEvent}</td>
                  <td>{row.teamName}</td>
                  <td>
                    <ul className={styles.anggota}>
                      {row.members.map((m) => (
                        <li key={m.handle} className={styles.anggotaItem}>
                          <span className={styles.handle}>@{m.handle}</span>{" "}
                          {m.checkedInAt ? (
                            <>
                              {m.checkedInAt}
                              {m.skippedGate ? (
                                <span className={styles.catatan}> skipped gate</span>
                              ) : null}
                            </>
                          ) : (
                            <span className={styles.catatan}>belum</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    <StatusBadge tone={s.tone}>{s.label}</StatusBadge>
                  </td>
                  <td>{tanggal(row.registeredAt)}</td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </GlassPanel>
  )
}
