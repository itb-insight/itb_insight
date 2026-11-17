"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import styles from "./TimelineSectionHifi.module.css"
import { useIsMobile } from "@/features/landing/hooks/useIsMobile"

// Same schedule as TIMELINE_STEPS in src/features/compe-page1/CompePage1.tsx
// (the competition landing page), with "Final" shown as "D-DAY". Keep in sync.
const items = [
  { name: "Pendaftaran", date: "Agustus – November 2026" },
  { name: "Warm Up & Technical Meeting", date: "September – November 2026" },
  { name: "Penyisihan", date: "Oktober – November 2026" },
  { name: "Pengumuman Finalis", date: "Oktober – November 2026" },
  { name: "D-DAY", date: "Akhir November 2026" },
]

// v2 circle art, per position (see public/images/timeline/REF.md).
// The active (newest) circle shows its color; past circles use "full".
const CIRCLE_COLORS = ["green", "purple", "yellow", "blue", "red"]

const STEP_PX = 100
const STEPS = items.length + 1
const RUNWAY_PX = STEP_PX * STEPS

// Reference design size the zigzag (circle1-5 / conn1-4) positions were built for.
// Desktop scales this whole canvas down to fit narrower-than-1100px viewports.
const CANVAS_WIDTH = 1100
const CANVAS_HEIGHT = 700

export default function TimelineSectionHifi() {
  const [visibleCount, setVisibleCount] = useState(0)
  const [scale, setScale] = useState(1)
  const sectionRef = useRef<HTMLElement>(null)
  const pinnedRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const circleRefs = useRef<(HTMLDivElement | null)[]>([])
  const isMobile = useIsMobile(768)

  useEffect(() => {
    const updateScale = () => {
      if (!wrapperRef.current) return
      setScale(Math.min(1, wrapperRef.current.offsetWidth / CANVAS_WIDTH))
    }
    updateScale()
    window.addEventListener("resize", updateScale)
    return () => window.removeEventListener("resize", updateScale)
  }, [])

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const section = sectionRef.current
      const pinned = pinnedRef.current
      const wrapper = wrapperRef.current
      if (!section || !pinned || !wrapper) return

      const pinnedStyle = getComputedStyle(pinned)

      if (pinnedStyle.position !== "sticky") {
        const line = window.innerHeight * 0.6
        const crossed = circleRefs.current.filter(
          (el) => el && el.getBoundingClientRect().top < line
        ).length
        const finished =
          crossed === items.length && wrapper.getBoundingClientRect().bottom < line
        setVisibleCount(finished ? STEPS : crossed)
        return
      }

      const rect = section.getBoundingClientRect()
      const zoom = section.offsetWidth ? rect.width / section.offsetWidth : 1
      const paddingTop = parseFloat(getComputedStyle(section).paddingTop)
      const stickyTop = parseFloat(pinnedStyle.top)
      const progress = stickyTop - (rect.top / zoom + paddingTop)
      setVisibleCount(
        progress < 0 ? 0 : Math.min(STEPS, Math.floor(progress / STEP_PX) + 1)
      )
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      cancelAnimationFrame(frame)
    }
  }, [])

  const getCircleSrc = (index: number) => {
    // visibleCount > items.length berarti step "semua abu-abu" sudah tercapai
    const allDone = visibleCount > items.length
    const isPast = index < visibleCount - 1 || allDone

    // Active (and not-yet-visible) circles show their color; past ones go "full".
    if (isPast) return "/images/timeline/v2/full.png"
    return `/images/timeline/v2/${CIRCLE_COLORS[index]}.png`
  }

  return (
    <section ref={sectionRef} className={styles.timeline}>
      <div ref={pinnedRef} className={styles.pinned}>
        <h2 className={styles.title}>TIMELINE</h2>

        <div
          ref={wrapperRef}
          className={styles.wrapper}
          style={!isMobile ? { height: CANVAS_HEIGHT * scale } : undefined}
        >
          <div
            className={styles.canvas}
            style={!isMobile ? { transform: `scale(${scale})` } : undefined}
          >

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
                src={isMobile ? "/images/conn-mobile.svg" : `/images/timeline/v1/conn-${i}-${i + 1}.svg`}
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
              ref={(el) => {
                circleRefs.current[i] = el
              }}
              className={`${styles.circle} ${styles[`circle${i + 1}`]}`}
              style={{
                opacity: i < visibleCount ? 1 : 0,
                transition: "opacity 0.6s ease",
              }}
            >
              <Image
                src={getCircleSrc(i)}
                alt=""
                fill
                className={styles.circleImage}
              />
              <div className={styles.circleText}>
                <span className={styles.circleName}>{item.name}</span>
                <span className={styles.circleDate}>{item.date}</span>
              </div>
            </div>
          ))}

          </div>
        </div>
      </div>

      <div className={styles.runway} style={{ height: RUNWAY_PX }} aria-hidden="true" />
    </section>
  )
}
