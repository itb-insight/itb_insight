import type { OnSiteLiveDto } from "../../data/types"
import Sparkline from "../charts/Sparkline"
import Panel from "../Panel/Panel"
import { wibTime } from "./format"
import styles from "./Live.module.css"

export default function LiveOnSitePanel({ data }: { data: OnSiteLiveDto }) {
  const points = data.slots.map((slot) => ({ day: wibTime(slot.slot), views: slot.count }))

  return (
    <Panel title="On Site Today" subtitle="Gate check-ins and opted-in presence (WIB)">
      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt className={styles.statLabel}>Checked in</dt>
          <dd className={styles.statValue}>{data.checked_in.toLocaleString()}</dd>
        </div>
        <div className={styles.stat}>
          <dt className={styles.statLabel}>In the area now</dt>
          <dd className={styles.statValue}>{data.in_area_now.toLocaleString()}</dd>
          <dd className={styles.statNote}>
            {data.active_now.toLocaleString()} tracked phones (last 5 min)
            {data.in_area_now > data.active_now
              ? ` + ${(data.in_area_now - data.active_now).toLocaleString()} they represent`
              : ""}
          </dd>
        </div>
        <div className={styles.stat}>
          <dt className={styles.statLabel}>Unique visitors</dt>
          <dd className={styles.statValue}>{data.unique_visitors.toLocaleString()}</dd>
          <dd className={styles.statNote}>
            ever in the area or scanned at the gate
            {data.represented_total > 0 ? `, incl. ${data.represented_total.toLocaleString()} represented` : ""}
          </dd>
        </div>
        <div className={styles.stat}>
          <dt className={styles.statLabel}>Tracking on</dt>
          <dd className={styles.statValue}>{data.presence_users.toLocaleString()}</dd>
          <dd className={styles.statNote}>opted in, seen today</dd>
        </div>
      </dl>

      <h3 className={styles.subheading}>Check-ins per 15 minutes</h3>
      {points.length > 0 ? (
        <Sparkline points={points} label="Gate check-ins per 15 minutes" />
      ) : (
        <p className={styles.empty}>No gate check-ins yet today.</p>
      )}
      <p className={styles.footnote}>
        Presence figures cover only visitors who turned booth tracking on and keep the site open: a
        sample, not a headcount. A represented group (parent, teacher) counts as in the area while
        its representative&apos;s phone is; unique visitors only ever go up.
      </p>
    </Panel>
  )
}
