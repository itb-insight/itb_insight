import Image from "next/image"
import styles from "./AboutSection.module.css"
import Link from "next/link"
import { ArrowDownRight } from "lucide-react"

export default function AboutSection() {
  return (
    <section className={styles.about}>
      <div className={styles.content}>
        <h2 className={styles.title}>
          <span className={styles.titleRegular}>INSIGHT</span>
          <span className={styles.titleLight}>ITB</span>
        </h2>

        <p className={styles.description}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
          ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat.
        </p>

        <Link href="/about" className={styles.readMore}>
          Read More <ArrowDownRight size={20} />
        </Link>
      </div>

      <div className={styles.imageWrapper}>
        <Image
          src="/images/about-visual.png"
          alt="Insight ITB Visual"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className={styles.image}
        />
      </div>
    </section>
  )
}