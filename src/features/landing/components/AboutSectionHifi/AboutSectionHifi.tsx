"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import styles from "./AboutSectionHifi.module.css"

export default function AboutSectionHifi() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  const maxProgress = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return
      const scrollY = window.scrollY - sectionRef.current.offsetTop
      const sectionHeight = sectionRef.current.offsetHeight
      const progress = Math.min(Math.max(scrollY / (sectionHeight * 0.3), 0), 1)
      setScrollProgress(progress)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const illustrationOpacity = Math.min(1, scrollProgress / 0.15)

  const illustrationScale = scrollProgress < 0.33
    ? 1.8
    : Math.max(0.8, 1.8 - ((scrollProgress - 0.33) / 0.33) * 1)

  const illustrationRotate = scrollProgress < 0.33
    ? 0
    : scrollProgress < 0.66
      ? -((scrollProgress - 0.33) / 0.33) * 10
      : -10 - ((scrollProgress - 0.66) / 0.34) * 10

  const phase2Opacity = Math.min(1, Math.max(0, (scrollProgress - 0.3) / 0.2))
  const phase2Y = Math.max(0, 30 * (1 - (scrollProgress - 0.3) / 0.2))

  const phase3Opacity = Math.min(1, Math.max(0, (scrollProgress - 0.65) / 0.2))
  const phase3Y = Math.max(0, 30 * (1 - (scrollProgress - 0.65) / 0.2))

  return (
      <section ref={sectionRef} className={styles.about}>
        <div className={styles.sticky}>

          <div className={styles.textWrapper}>
            <div
              className={styles.phase2Text}
              style={{
                opacity: phase2Opacity,
                transform: `translateY(${phase2Y}px)`,
              }}
            >
              <h2 className={styles.title}>ITB INSIGHT</h2>
              <p className={styles.description}>
                Insight ITB merupakan sebuah event teknologi yang telah
                diselenggarakan dari tahun 20XX yang diprakarsai oleh XXXX.
                Kini, Insight ITB merupakan event teknologi terbesar di ITB
                yang terdiri dari beberapa rangkaian acara seperti pameran,
                seminar, dan kompetisi.
              </p>
            </div>

            <div
              className={styles.phase3Text}
              style={{
                opacity: phase3Opacity,
                transform: `translateY(${phase3Y}px)`,
              }}
            >
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>REGISTRATION DATE</span>
                <div className={styles.infoValue}>
                  <img src="/images/icons/calendar-icon.svg" alt="" className={styles.calendarIcon} />
                  <span>1 - 5 Mei 2026</span>
                </div>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>TOTAL PRIZEPOOL</span>
                <div className={styles.infoValue}>
                  <span>RP67.000.000</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.illustrationWrapper}>
            <Image
              src="/images/about-illustration.webp"
              alt="ITB Insight Illustration"
              width={600}
              height={600}
              className={styles.illustration}
              style={{
                opacity: illustrationOpacity,
                transform: `scale(${illustrationScale}) rotate(${illustrationRotate}deg)`,
              }}
              priority
            />
          </div>

        </div>
      </section>
    )
}