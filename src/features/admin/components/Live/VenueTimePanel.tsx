import type { VenueTimeDto } from "../../data/types"
import BarRow from "../charts/BarRow"
import Panel from "../Panel/Panel"
import { dwell } from "./format"
import styles from "./Live.module.css"

export default function VenueTimePanel({ data }: { data: VenueTimeDto }) {
  const max = Math.max(1, ...data.buckets.map((bucket) => bucket.count))

  return (
    <Panel title="Time at the Venue" subtitle="Gate check-in to last booth scan or presence ping">
      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt className={styles.statLabel}>Median</dt>
          <dd className={styles.statValue}>{dwell(data.median_s)}</dd>
        </div>
        <div className={styles.stat}>
          <dt className={styles.statLabel}>Measured</dt>
          <dd className={styles.statValue}>{data.measured.toLocaleString()}</dd>
          <dd className={styles.statNote}>visitors</dd>
        </div>
      </dl>

      <div className={styles.rows}>
        {data.buckets.map((bucket) => (
          <BarRow
            key={bucket.label}
            label={bucket.label}
            value={bucket.count.toLocaleString()}
            pct={(bucket.count / max) * 100}
          />
        ))}
      </div>
      <p className={styles.footnote}>
        {data.unmeasured.toLocaleString()} checked-in visitor{data.unmeasured === 1 ? "" : "s"} with no
        scan or ping since: time unknown, left out.
      </p>
    </Panel>
  )
}
