import Image from "next/image"
import DroneMount from "@/features/drone/DroneMount"
import styles from "./TimelineSection.module.css"

export default function TimelineSection() {
  return (
    <section className={styles.timeline}>


      <div className={styles.badge}>drone</div>

      <DroneMount componentId="drone-timeline" label="drone" />

      <h2 className={styles.title}>TIMELINE</h2>
      <div className={styles.imageWrapper}>
        <Image
          src="/images/timeline-bg.png"
          alt="Timeline"
          fill
          sizes="(max-width: 1200px) 100vw, 1140px"
          className={styles.image}
        />
      </div>
    </section>
  )
}