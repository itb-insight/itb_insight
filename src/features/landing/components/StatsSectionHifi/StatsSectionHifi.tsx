"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import styles from "./StatsSectionHifi.module.css"

const stats = [
  { value: "120", label: "collaborators", className: "collaborators" },
  { value: "670", label: "exhibitors", className: "exhibitors" },
  { value: "67.000", label: "visitors", className: "visitors" },
]

export default function StatsSectionHifi() {
  const [animProgress, setAnimProgress] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  const hasStarted = useRef(false)
  const animFrame = useRef<number>(0)
  const startTime = useRef<number>(0)

  const DURATION = 1200 // ms

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted.current) {
          hasStarted.current = true
          startTime.current = performance.now()

          const animate = (now: number) => {
            const elapsed = now - startTime.current
            const progress = Math.min(elapsed / DURATION, 1)
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setAnimProgress(eased)

            if (progress < 1) {
              animFrame.current = requestAnimationFrame(animate)
            }
          }

          animFrame.current = requestAnimationFrame(animate)
        }
      },
      { threshold: 0.3 }
    )

    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(animFrame.current)
    }
  }, [])

  // Scale: 3 → 1
  const scale = 3 - animProgress * 2

  const rotate = -22.41 + animProgress * 22.41

  const illustrationOpacity = Math.min(1, animProgress / 1)

  const textOpacity = Math.min(1, Math.max(0, (animProgress - 0.85) / 0.15))

  return (
    <section ref={sectionRef} className={styles.stats}>
      <div className={styles.wrapper}>
        <div
          className={styles.illustrationContainer}
          style={{
            transform: `scale(${scale}) rotate(${rotate}deg)`,
            opacity: illustrationOpacity,
          }}
        >
          <Image
            src="/images/stats-illustration.webp"
            alt="Stats Illustration"
            fill
            sizes="(max-width: 768px) 100vw, 80vw"
            className={styles.illustration}
          />
        </div>

        {/* Stat items */}
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`${styles.statItem} ${styles[stat.className]}`}
            style={{ opacity: textOpacity }}
          >
            <span className={styles.value}>{stat.value}</span>
            <span className={styles.label}>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}