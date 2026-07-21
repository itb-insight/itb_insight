import Image from "next/image"
import styles from "./AboutSection.module.css"
import Link from "next/link"
import { ArrowDownRight } from "lucide-react"

export default function AboutSection() {
  return (
    <section className={styles.about}>
      <div className={styles.content}>
        <h2 className={styles.title}>
          <span className={styles.titleRegular}>ITB</span>
          <span className={styles.titleLight}>INSIGHT</span>
        </h2>

        <p className={styles.description}>
          ITB INSIGHT is Bandung Institute of Technology&apos;s annual innovation
          expo — a stage where student teams turn coursework into working
          prototypes. Over one week, exhibitors, competitors, and speakers
          come together across robotics, software, and design to show what
          the next generation of engineers is building.
        </p>

        <Link href="/about" className={styles.readMore}>
          Read More <ArrowDownRight size={20} />
        </Link>
      </div>

      <div className={styles.imageWrapper}>
        <Image
          src="/images/about-visual.png"
          alt="ITB Insight Visual"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className={styles.image}
        />
      </div>
    </section>
  )
}