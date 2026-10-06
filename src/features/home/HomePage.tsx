import ActivityCard from "./ActivityCard"
import CalendarCard from "./CalendarCard"
import CountdownCard from "./CountdownCard"
import HomeBackground from "./HomeBackground"
import styles from "./HomePage.module.css"

interface HomePageProps {
  serverNow?: number
}

export default function HomePage({ serverNow }: HomePageProps) {
  return (
    <div className={styles.page}>
      <HomeBackground />

      <main className={styles.main}>
        <h1 className={styles.welcome}>Welcome User!</h1>
        <ActivityCard />
      </main>

      <aside className={styles.rail}>
        <CountdownCard serverNow={serverNow} />
        <CalendarCard serverNow={serverNow} />
      </aside>
    </div>
  )
}
