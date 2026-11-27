import { clockWib } from "../format"
import styles from "./QuestOps.module.css"

interface LeaderboardControlProps {
  frozen: boolean
  freezeAt: string | null
  refreshedAt: string
  onToggleFreeze: () => void
  onRefresh: () => void
}

export default function LeaderboardControl({
  frozen,
  freezeAt,
  refreshedAt,
  onToggleFreeze,
  onRefresh,
}: LeaderboardControlProps) {
  return (
    <section className={styles.panel} aria-labelledby="lb-title">
      <h2 id="lb-title" className={styles.panelTitle}>
        Leaderboard {frozen && <span className={styles.frozenTag}>FROZEN</span>}
      </h2>
      <div>
        <p className={styles.muted}>Snapshot every 5 min · terakhir {clockWib(refreshedAt)} WIB</p>
        <p className={styles.muted}>Auto-freeze at {freezeAt ? `${clockWib(freezeAt)} WIB` : "-"}</p>
      </div>
      <div className={styles.actions}>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={onToggleFreeze}>
          {frozen ? "Unfreeze" : "Freeze Now"}
        </button>
        <button type="button" className={styles.btn} onClick={onRefresh}>
          Force refresh
        </button>
      </div>
    </section>
  )
}
