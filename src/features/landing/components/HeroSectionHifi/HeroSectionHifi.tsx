"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import styles from "./HeroSectionHifi.module.css"
import { useIsMobile } from "@/features/landing/hooks/useIsMobile"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function useCountdown(targetDate: string): TimeLeft {
  const calculate = (): TimeLeft => {
    const diff = new Date(targetDate).getTime() - Date.now()
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    }
  }

  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    setTimeLeft(calculate())
    const timer = setInterval(() => setTimeLeft(calculate()), 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  return timeLeft
}

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

export default function HeroSectionHifi() {
  const [mounted, setMounted] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  const { days, hours, minutes, seconds } = useCountdown("2026-09-11T00:00:00")
  const isMobile = useIsMobile(768)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return
      const scrollY = window.scrollY
      const sectionHeight = sectionRef.current.offsetHeight
      const progress = Math.min(Math.max(scrollY / (sectionHeight * 0.6), 0), 1)
      setScrollProgress(progress)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Title scale: besar → kecil
  const scaleProgress = Math.min(scrollProgress / 0.5, 1)
  const titleScale = 1 - scaleProgress * 0.45

  const groupTopY = scrollProgress > 0.5
    ? -(scrollProgress - 0.5) * 100
    : 0
  const bottomGroupY = scrollProgress > 0.5
    ? (scrollProgress - 0.5) * 100
    : 0

  const countdownOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.2) / 0.3))
  const countdownY = Math.max(0, 30 * (1 - (scrollProgress - 0.2) / 0.3))

  const bottomOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.6) / 0.3))
  const bottomY = Math.max(0, 30 * (1 - (scrollProgress - 0.6) / 0.3))

  const patternScale = scrollProgress < 0.33
    ? (isMobile ? 3.5 : 2.5)                                            // ← branched now
    : isMobile
      ? Math.max(3, 3.5 - ((scrollProgress - 0.33) / 0.33) * 0.5)  // mobile: shrinks less
      : Math.max(1.2, 2.5 - ((scrollProgress - 0.33) / 0.33) * 1.3)  // desktop: unchanged

  const patternOpacity = scrollProgress < 0.33
    ? 1
    : Math.max(0.3, 1 - ((scrollProgress - 0.33) / 0.33) * 0.7) // phase 2: opacity turun ke 0.3

  // Desktop splits the patterns apart in phase 3; mobile keeps them in place
  const patternSeparation = isMobile
    ? 0
    : scrollProgress > 0.66
      ? ((scrollProgress - 0.66) / 0.34) * 25  // 0 - 50vw
      : 0

  return (
    <section ref={sectionRef} className={styles.hero}>
      <div className={styles.sticky}>

        <div className={styles.patternWrapper}>
          <img
            src="/images/Pattern_Kiri.svg"
            alt=""
            className={styles.patternLeft}
            style={{
              transform: `translateX(calc(-50% - ${patternSeparation}vw)) scale(${patternScale})`,
              opacity: patternOpacity,
            }}
          />
          <img
            src="/images/Pattern_Kanan.svg"
            alt=""
            className={styles.patternRight}
            style={{
              transform: `translateX(calc(50% + ${patternSeparation}vw)) scale(${patternScale})`,
              opacity: patternOpacity,
            }}
          />
        </div>

        {/* Title + Countdown group — naik bareng */}
        <div
          className={styles.topGroup}
          style={{ transform: `translateY(${groupTopY}px)` }}
        >
          <h1
            className={styles.title}
            style={{
              transform: `scale(${titleScale})`,
            }}
          >
            ITB INSIGHT
          </h1>

          <div
            className={styles.countdown}
            style={{
              opacity: countdownOpacity,
              transform: `translateY(${countdownY}px)`,
            }}
          >
            {[
              { value: days, label: "d" },
              { value: hours, label: "h" },
              { value: minutes, label: "m" },
              { value: seconds, label: "s" },
            ].map(({ value, label }) => (
              <div key={label} className={styles.countdownUnit}>
                <span className={styles.countdownNumber}>
                  {mounted ? pad(value) : "00"}
                </span>
                <span className={styles.countdownLabel}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Description + Button */}
        <div
          className={styles.bottom}
          style={{
            opacity: bottomOpacity,
            transform: `translateY(${bottomY + bottomGroupY}px)`,
            pointerEvents: bottomOpacity > 0.5 ? "auto" : "none",
          }}
        >
          <p className={styles.description}>
            Are you ready for the biggest technological event in ITB?
          </p>
          <Link href="/register" className={styles.registerBtn}>
            Register Now
          </Link>
        </div>

      </div>
    </section>
  )
}