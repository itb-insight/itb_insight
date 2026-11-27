import ActivityCard from "./ActivityCard"
import CalendarCard from "./CalendarCard"
import CountdownCard from "./CountdownCard"
import DDayQrJump from "./DDayQrJump"
import HomeBackground from "./HomeBackground"
import styles from "./HomePage.module.css"
import PointsCard, { type PointsSummary } from "./PointsCard"
import type { ActivityEntry } from "./activityTypes"
import type { AgendaItem } from "./agendaData"

interface HomePageProps {
  /** null = could not be loaded; undefined = not shown. */
  points?: PointsSummary | null
  isCommittee?: boolean
  canScan?: boolean
  serverNow?: number
  /** First name for the greeting; "User" when unknown. */
  userName?: string
  /** null = the activity could not be loaded. */
  activity: ActivityEntry[] | null
  /** Calendar agenda: D-Day, events, and the user's competition timelines. */
  agenda: AgendaItem[]
}

export default function HomePage({
  serverNow,
  userName,
  activity,
  agenda,
  points,
  isCommittee = false,
  canScan = false,
}: HomePageProps) {
  return (
    <div className={styles.page}>
      <DDayQrJump />
      <HomeBackground />

      <main className={styles.main}>
        <h1 className={styles.welcome}>Welcome {userName || "User"}!</h1>
        <ActivityCard entries={activity} />
      </main>

      <aside className={styles.rail}>
        {points !== undefined ? <PointsCard points={points} isCommittee={isCommittee} canScan={canScan} /> : null}
        <CountdownCard serverNow={serverNow} />
        <CalendarCard serverNow={serverNow} agenda={agenda} />
      </aside>
    </div>
  )
}
