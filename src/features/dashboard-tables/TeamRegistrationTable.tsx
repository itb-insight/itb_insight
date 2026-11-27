"use client"

import { useMemo, useState } from "react"

import { FilterChips, GlassPanel, StatusBadge } from "@/shared/components/GlassTable"
import type { ChipOption, StatusTone } from "@/shared/components/GlassTable"
import gb from "@/shared/components/GlassTable/GradientBorder.module.css"
import tableStyles from "@/shared/components/GlassTable/GlassTable.module.css"
import type { CompetitionOption, TeamRegistrationRow, TeamRegistrationStatus } from "./types"
import styles from "./TeamRegistrationTable.module.css"

const ALL = "all"

const STATUS: Record<TeamRegistrationStatus, { label: string; tone: StatusTone }> = {
  registered: { label: "Terdaftar", tone: "success" },
  withdrawn: { label: "Mengundurkan diri", tone: "neutral" },
  awaiting_payment: { label: "Menunggu pembayaran", tone: "warning" },
  expired: { label: "Kadaluwarsa", tone: "danger" },
}

const RESENDABLE: TeamRegistrationStatus[] = ["awaiting_payment", "expired"]

function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })
}

interface TeamRegistrationTableProps {
  rows: TeamRegistrationRow[]
  competitions: CompetitionOption[]
  title?: string
  subtitle?: string
  onDetail?: (row: TeamRegistrationRow) => void
  onResendLink?: (row: TeamRegistrationRow) => void
  /** Members are @handles (the mock); false writes their names as they are. */
  memberHandles?: boolean
  /** Rows shown first; the rest behind a "Tampilkan lagi" button. All rows without it. */
  pageSize?: number
}

export default function TeamRegistrationTable({
  rows,
  competitions,
  title = "Berapa banyak tim yang sudah daftar, dan statusnya",
  subtitle = "Status pembayaran hanya dari webhook midtrans",
  onDetail,
  onResendLink,
  memberHandles = true,
  pageSize,
}: TeamRegistrationTableProps) {
  const firstPage = pageSize ?? Number.POSITIVE_INFINITY
  const [limit, setLimit] = useState(firstPage)
  // Without handlers the buttons would do nothing, so the action column is left out.
  const actions = Boolean(onDetail || onResendLink)
  const [query, setQuery] = useState("")
  const [competition, setCompetition] = useState<string>(ALL)

  const chipOptions = useMemo<ChipOption<string>[]>(
    () => [{ value: ALL, label: "Semua lomba" }, ...competitions],
    [competitions],
  )

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (competition !== ALL && row.competition !== competition) return false
      if (!needle) return true
      return (
        (row.teamName ?? "").toLowerCase().includes(needle) ||
        row.members.some((member) => member.toLowerCase().includes(needle))
      )
    })
  }, [rows, query, competition])

  return (
    <GlassPanel
      title={title}
      subtitle={subtitle}
      toolbar={
        <div className={styles.toolbar}>
          <div className={`${gb.border} ${styles.searchBox}`}>
            <input
              type="search"
              className={styles.search}
              placeholder="cari nama tim atau anggota"
              aria-label="Cari nama tim atau anggota"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setLimit(firstPage)
              }}
            />
          </div>
          <FilterChips
            options={chipOptions}
            value={competition}
            onChange={(value) => {
              setCompetition(value)
              setLimit(firstPage)
            }}
            variant="dark"
            ariaLabel="Filter lomba"
          />
        </div>
      }
    >
      <table className={`${tableStyles.table} ${styles.table}`}>
        <colgroup>
          <col style={{ width: actions ? "5.1%" : "12%" }} />
          <col style={{ width: actions ? "19.7%" : "18.5%" }} />
          <col style={{ width: "15.1%" }} />
          <col style={{ width: actions ? "21.5%" : "26.9%" }} />
          <col style={{ width: "15.5%" }} />
          <col style={{ width: "11.9%" }} />
          {actions ? <col style={{ width: "11.2%" }} /> : null}
        </colgroup>
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Competition</th>
            <th scope="col">Nama tim</th>
            <th scope="col">Anggota</th>
            <th scope="col">Status</th>
            <th scope="col">Daftar pada</th>
            {actions ? <th scope="col"><span className={styles.srOnly}>Aksi</span></th> : null}
          </tr>
        </thead>
        <tbody>
          {visible.length === 0 ? (
            <tr>
              <td colSpan={actions ? 7 : 6} className={tableStyles.empty}>Tidak ada tim yang cocok.</td>
            </tr>
          ) : (
            visible.slice(0, limit).map((row) => {
              const status = STATUS[row.status]
              const resend = RESENDABLE.includes(row.status)
              return (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.competitionLabel}</td>
                  <td className={row.teamName ? undefined : tableStyles.small}>
                    {row.teamName ?? "Belum diberi nama"}
                  </td>
                  <td className={styles.members}>
                    {row.members.map((member) => (memberHandles ? `@${member}` : member)).join(", ")}
                  </td>
                  <td>
                    <div className={styles.fit}>
                      <StatusBadge tone={status.tone} className={`${styles.pill} ${styles[row.status]}`}>
                        {status.label}
                      </StatusBadge>
                    </div>
                  </td>
                  <td>{formatDate(row.registeredAt)}</td>
                  {actions ? (
                  <td>
                    <div className={styles.fit}>
                      <button
                        type="button"
                        className={`${gb.border} ${styles.action} ${resend ? styles.resend : styles.detail}`}
                        onClick={() => (resend ? onResendLink?.(row) : onDetail?.(row))}
                      >
                        {resend ? "Kirim ulang link" : "Detail"}
                      </button>
                    </div>
                  </td>
                  ) : null}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
      {visible.length > limit ? (
        <button
          type="button"
          className={`${gb.border} ${styles.action} ${styles.detail} ${styles.more}`}
          onClick={() => setLimit((current) => current + (pageSize ?? visible.length))}
        >
          Tampilkan {Math.min(pageSize ?? visible.length, visible.length - limit)} lagi ({limit} dari {visible.length})
        </button>
      ) : null}
    </GlassPanel>
  )
}
