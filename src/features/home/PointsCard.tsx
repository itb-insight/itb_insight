import Link from "next/link"

import cardStyles from "./HomeCard.module.css"
import styles from "./PointsCard.module.css"

export type PointsSummary = {
  totalPoints: number
  totalVisited: number
  sidequestPoints: number
  recent: Array<{ key: string; label: string; points: number; by: string | null }>
}

interface PointsCardProps {
  /** null = the points could not be loaded. */
  points: PointsSummary | null
  /** Committee / sponsor accounts (profiles.role_a set) do not collect points. */
  isCommittee: boolean
  /** Booth staff, exhibitors, field staff and admins get a link to the booth scanner. */
  canScan: boolean
}

const signed = (n: number) => (n > 0 ? `+${n}` : String(n))

/** The visitor's booth + sidequest points, shown on the home dashboard. */
export default function PointsCard({ points, isCommittee, canScan }: PointsCardProps) {
  return (
    <section className={`${cardStyles.surface} ${styles.card}`} aria-labelledby="points-heading">
      <h2 id="points-heading" className={styles.label}>
        Poin kamu
      </h2>

      {isCommittee ? (
        <p className={styles.note}>Akun panitia tidak mengumpulkan poin.</p>
      ) : points === null ? (
        <p className={styles.note}>Poin belum bisa dimuat. Coba muat ulang halaman.</p>
      ) : (
        <>
          <p className={styles.value}>{points.totalPoints}</p>
          <p className={styles.meta}>
            {points.totalVisited} booth dikunjungi
            {points.sidequestPoints > 0 ? ` · ${points.sidequestPoints} poin sidequest` : ""}
          </p>

          {points.recent.length > 0 ? (
            <ul className={styles.recent}>
              {points.recent.map((entry) => (
                <li key={entry.key} className={styles.recentRow}>
                  <span className={styles.recentPoints}>{signed(entry.points)}</span>
                  <span className={styles.recentText}>
                    {entry.label}
                    {entry.by ? <span className={styles.by}> · dari kak {entry.by}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.note}>Tunjukkan QR di halaman Profil ke staf booth untuk mendapat poin.</p>
          )}
        </>
      )}

      {canScan ? (
        <Link href="/dashboard/booth-scan" className={styles.scanLink}>
          Buka scanner booth
        </Link>
      ) : null}
    </section>
  )
}
