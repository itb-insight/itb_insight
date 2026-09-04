"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import styles from "./TimelineSectionHifi.module.css"

const items = [
  { name: "Pendaftaran", date: "5-23 Januari 2026" },
  { name: "Warm Up & Technical Meeting", date: "30 Januari 2026" },
  { name: "Penyisihan", date: "7 Februari 2026" },
  { name: "Pengumuman Finalis", date: "18 Februari 2026" },
  { name: "Final", date: "1 Maret 2026" },
]

const INTERVAL_MS = 1500

export default function TimelineSectionHifi() {
  const [visibleCount, setVisibleCount] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  const hasStarted = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted.current) {
          hasStarted.current = true
          let count = 0
          const show = () => {
            count++
            setVisibleCount(count)
            // Lanjut sampai items.length + 1 untuk trigger a5
            if (count <= items.length) {
              intervalRef.current = setTimeout(show, INTERVAL_MS)
            }
          }
          intervalRef.current = setTimeout(show, 500)
        }
      },
      { threshold: 0.2 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => {
      observer.disconnect()
      if (intervalRef.current) clearTimeout(intervalRef.current)
    }
  }, [])

  const getCircleSrc = (index: number) => {
    // visibleCount > items.length berarti step "semua abu-abu" sudah tercapai
    const allDone = visibleCount > items.length
    const isPast = index < visibleCount - 1 || allDone
    const isActive = index === visibleCount - 1 && !allDone

    if (isPast) return `/images/timeline/circle-a${index + 1}.svg`
    if (isActive) return `/images/timeline/circle-c${index + 1}.svg`
    return `/images/timeline/circle-c${index + 1}.svg`
  }

  return (
    <section ref={sectionRef} className={styles.timeline}>
      <h2 className={styles.title}>TIMELINE</h2>

      <div className={styles.wrapper}>

        {/* Connectors */}
        {[1, 2, 3, 4].map((i) => (
          <div
            key={`conn-${i}`}
            className={`${styles.connector} ${styles[`conn${i}`]}`}
            style={{
              opacity: i < visibleCount ? 1 : 0,
              transition: "opacity 0.6s ease",
            }}
          >
            <Image
              src={`/images/timeline/conn-${i}-${i + 1}.svg`}
              alt={`Connector ${i}`}
              fill
              className={styles.connectorImage}
            />
          </div>
        ))}

        {/* Circles */}
        {items.map((item, i) => (
          <div
            key={i}
            className={`${styles.circle} ${styles[`circle${i + 1}`]}`}
            style={{
              opacity: i < visibleCount ? 1 : 0,
              transition: "opacity 0.6s ease",
            }}
          >
            <Image
              src={getCircleSrc(i)}
              alt={item.name}
              fill
              className={styles.circleImage}
            />
          </div>
        ))}

      </div>
    </section>
  )
}