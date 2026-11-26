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
    <section className={clsx(styles.pointsCard, compact && styles.pointsCardCompact)} aria-label="Your points">
      <div className={styles.stats}>
        <div>
          <span className={styles.statLabel}>My points</span>
          <span className={styles.statValue}>{numberFormat.format(stats.points)}</span>
        </div>
        <div>
          <span className={styles.statLabel}>Lifetime</span>
          <span className={styles.statValue}>{numberFormat.format(stats.lifetime)}</span>
        </div>
        <div>
          <span className={styles.statLabel}>Rank</span>
          <span className={styles.statValue}>
            {stats.rank}
            <span className={styles.statSub}>/ {stats.totalRanked}</span>
          </span>
        </div>
      </div>
      <div className={styles.tierRow}>
        <span>Nest reward tier: {stats.tierName}</span>
        <span>
          {numberFormat.format(stats.lifetime)} / {numberFormat.format(stats.tierTarget)}
        </span>
      </div>
      <SegmentBar filled={stats.tierSegments.filled} total={stats.tierSegments.total} />
    </section>
  )
}
