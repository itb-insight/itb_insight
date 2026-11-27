"use client"

import type { LiveDto } from "../../data/types"
import PanelUnavailable from "../Panel/PanelUnavailable"
import BoothLeaderboardPanel from "./BoothLeaderboardPanel"
import LiveOnSitePanel from "./LiveOnSitePanel"
import LiveWebPanel from "./LiveWebPanel"
import UpdatedAgo from "./UpdatedAgo"
import VenueTimePanel from "./VenueTimePanel"
import { useLiveData } from "./useLiveData"
import styles from "./Live.module.css"

/** The "D-day live" section at the top of /admin. */
export default function LiveDashboard({ initial }: { initial: LiveDto }) {
  const { data, failed } = useLiveData(initial)

  return (
    <section className={styles.section} aria-labelledby="dday-live-title">
      <header className={styles.sectionHeader}>
        <h2 id="dday-live-title" className={styles.sectionTitle}>
          D-day live
        </h2>
        <UpdatedAgo at={data.generated_at} failed={failed} />
      </header>

      <div className={styles.grid}>
        {data.onsite ? (
          <>
            <LiveOnSitePanel data={data.onsite} />
            <VenueTimePanel data={data.onsite.venue} />
            <BoothLeaderboardPanel booths={data.onsite.booths} limit={8} />
          </>
        ) : (
          <PanelUnavailable title="On Site Today" source="Supabase" />
        )}
        <LiveWebPanel data={data.web} configured={data.web_configured} />
      </div>
    </section>
  )
}
