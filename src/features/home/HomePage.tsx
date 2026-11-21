import ActivityCard from "./ActivityCard"
import CalendarCard from "./CalendarCard"
import CountdownCard from "./CountdownCard"
import HomeBackground from "./HomeBackground"
import styles from "./HomePage.module.css"
import type { ActivityEntry } from "./activityTypes"
import type { AgendaItem } from "./agendaData"

interface HomePageProps {
  serverNow?: number
  /** First name for the greeting; "User" when unknown. */
  userName?: string
  /** null = the activity could not be loaded. */
  activity: ActivityEntry[] | null
  /** Calendar agenda: D-Day, events, and the user's competition timelines. */
  agenda: AgendaItem[]
}

export default function HomePage({ serverNow, userName, activity, agenda }: HomePageProps) {
  return (
    <div className={styles.page}>
      <HomeBackground />

      <main className={styles.main}>
        <h1 className={styles.welcome}>Welcome {userName || "User"}!</h1>
        <ActivityCard entries={activity} />
      </main>

      <aside className={styles.rail}>
        <CountdownCard serverNow={serverNow} />
        <CalendarCard serverNow={serverNow} agenda={agenda} />
      </aside>
    </div>
  )
}
