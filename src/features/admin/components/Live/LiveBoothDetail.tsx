"use client"

import type { LiveDto } from "../../data/types"
import PanelUnavailable from "../Panel/PanelUnavailable"
import BoothLeaderboardPanel from "./BoothLeaderboardPanel"
import UpdatedAgo from "./UpdatedAgo"
import { useLiveData } from "./useLiveData"
import styles from "./Live.module.css"

/** Every booth, today, on /admin/analytics. */
export default function LiveBoothDetail({ initial }: { initial: LiveDto }) {
  const { data, failed } = useLiveData(initial)

  return (
    <section id="booths" className={styles.section} aria-labelledby="booths-title">
      <header className={styles.sectionHeader}>
        <h2 id="booths-title" className={styles.sectionTitle}>
          Booths today
        </h2>
        <UpdatedAgo at={data.generated_at} failed={failed} />
      </header>
      {data.onsite ? (
        <BoothLeaderboardPanel booths={data.onsite.booths} full />
      ) : (
        <PanelUnavailable title="Booth Leaderboard" source="Supabase" full />
      )}
    </section>
  )
}
