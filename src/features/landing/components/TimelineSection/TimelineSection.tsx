import Image from "next/image"
import styles from "./TimelineSection.module.css"

export default function TimelineSection() {
  return (
    <section className={styles.timeline}>
      <h2 className={styles.title}>TIMELINE</h2>

      <div className={styles.badge}>drone</div>

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