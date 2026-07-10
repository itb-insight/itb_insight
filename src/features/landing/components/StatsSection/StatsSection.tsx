import Image from "next/image"
import styles from "./StatsSection.module.css"

const stats = [
  { value: "670", label: "collaborators" },
  { value: "670", label: "exhibitors" },
  { value: "67.000", label: "visitors" },
]

export default function StatsSection() {
  return (
    <section className={styles.stats}>
      <div className={styles.wrapper}>
        <Image
          src="/images/stats-shape.svg"
          alt=""
          fill
          sizes="100vw"
          className={styles.svg}
        />

        {/* Circle kiri bawah - collaborators */}
        <div className={`${styles.statItem} ${styles.collaborators}`}>
          <span className={styles.value}>{stats[0].value}</span>
          <span className={styles.label}>{stats[0].label}</span>
        </div>

        {/* Circle kanan atas - exhibitors */}
        <div className={`${styles.statItem} ${styles.exhibitors}`}>
          <span className={styles.value}>{stats[1].value}</span>
          <span className={styles.label}>{stats[1].label}</span>
        </div>

        {/* Circle kanan bawah - visitors */}
        <div className={`${styles.statItem} ${styles.visitors}`}>
          <span className={styles.value}>{stats[2].value}</span>
          <span className={styles.label}>{stats[2].label}</span>
        </div>
      </div>
    </section>
  )
}