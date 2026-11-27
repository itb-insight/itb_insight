import clsx from "clsx"

import SegmentBar from "./SegmentBar"
import styles from "./quest.module.css"
import type { QuestStats } from "./types"

const numberFormat = new Intl.NumberFormat("en-US")

interface PointsCardProps {
  stats: QuestStats
  compact?: boolean
}

export default function PointsCard({ stats, compact }: PointsCardProps) {
  return (
    <section className={clsx(styles.pointsCard, compact && styles.pointsCardCompact)} aria-label="Poin Insight Arcade">
      <div className={styles.stats}>
        <div>
          <span className={styles.statLabel}>Poin</span>
          <span className={styles.statValue}>{numberFormat.format(stats.points)}</span>
        </div>
        <div>
          <span className={styles.statLabel}>Pemain</span>
          <span className={styles.statValue}>{numberFormat.format(stats.totalRanked)}</span>
        </div>
        <div>
          <span className={styles.statLabel}>Peringkat</span>
          <span className={styles.statValue}>{stats.rank > 0 ? `#${stats.rank}` : "-"}</span>
        </div>
      </div>
      <div className={styles.tierRow}>
        <span>{stats.tierName}</span>
        <span>
          {numberFormat.format(stats.points)} / {numberFormat.format(stats.tierTarget)}
        </span>
      </div>
      <SegmentBar filled={stats.tierSegments.filled} total={stats.tierSegments.total} />
    </section>
  )
}
