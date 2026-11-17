"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import styles from "./HeroSectionHifi.module.css"
import { useIsMobile } from "@/features/landing/hooks/useIsMobile"
import { useIsSignedIn } from "@/features/landing/hooks/useIsSignedIn"
import { COUNTDOWN_TARGET } from "@/features/home/homeConfig"

/** "Scroll ke bawah" jumps to this fraction (0–1) of the page's total scroll distance. Tune freely. */
const SCROLL_HINT_TARGET = 0.2

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

// One shared 1 s clock. Only <Countdown> subscribes, so the rest of the hero (scroll-driven
// transforms, images) does not re-render every second.
function subscribeToSeconds(onTick: () => void) {
  const timer = setInterval(onTick, 1000)
  return () => clearInterval(timer)
}
const currentSecond = () => Math.floor(Date.now() / 1000)
const noSecondOnServer = () => null

function timeLeftUntil(targetDate: string, nowSeconds: number): TimeLeft {
  const diff = new Date(targetDate).getTime() - nowSeconds * 1000
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

function Countdown() {
  // null on the server and during hydration: render "00" until the client clock is known.
  const nowSeconds = useSyncExternalStore(subscribeToSeconds, currentSecond, noSecondOnServer)
  const { days, hours, minutes, seconds } = nowSeconds === null
    ? { days: 0, hours: 0, minutes: 0, seconds: 0 }
    : timeLeftUntil(COUNTDOWN_TARGET, nowSeconds)

  return (
    <div className={styles.countdown}>
      {[
        { value: days, label: "d" },
        { value: hours, label: "h" },
        { value: minutes, label: "m" },
        { value: seconds, label: "s" },
      ].map(({ value, label }) => (
        <div key={label} className={styles.countdownUnit}>
          <span className={styles.countdownNumber}>{pad(value)}</span>
          <span className={styles.countdownLabel}>{label}</span>
        </div>
      ))}
    </div>
  )
}

export default function HeroSectionHifi() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  const isMobile = useIsMobile(768)
  const signedIn = useIsSignedIn()

  const handleScrollHint = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: max * SCROLL_HINT_TARGET, behavior: "smooth" })
  }

  // Hint is only for the first view: fade it out as soon as the user starts scrolling.
  const hintOpacity = Math.max(0, 1 - scrollProgress / 0.08)

  // The About section is scroll-driven (sticky), so its text only fades in a little way past the
  // section's top. Land there instead of on the (still empty) top edge.
  const handleExplore = () => {
    const about = document.getElementById("about")
    if (!about) return
    const rect = about.getBoundingClientRect()
    const top = rect.top + window.scrollY + rect.height * 0.35
    window.scrollTo({ top, behavior: "smooth" })
  }

  useEffect(() => {
    // At most one update per frame, and none once the value stops changing (e.g. far below the
    // hero): scroll events fire far more often than frames on high-refresh screens.
    let frame = 0
    const update = () => {
      frame = 0
      if (!sectionRef.current) return
      const sectionHeight = sectionRef.current.getBoundingClientRect().height
      const progress = Math.min(Math.max(window.scrollY / (sectionHeight * 0.6), 0), 1)
      setScrollProgress(Math.round(progress * 1000) / 1000)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    window.addEventListener("scroll", schedule, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
    }
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
    <section ref={sectionRef} id="hero" className={styles.hero}>
      <div className={styles.sticky}>

        <div className={styles.patternWrapper}>
          <img
            src="/images/Pattern_Kiri.svg"
            alt=""
            className={styles.patternLeft}
            style={{
              transform: `translateX(calc(-50% - ${patternSeparation}vw / var(--page-scale, 1))) scale(${patternScale})`,
              opacity: patternOpacity,
            }}
          />
          <img
            src="/images/Pattern_Kanan.svg"
            alt=""
            className={styles.patternRight}
            style={{
              transform: `translateX(calc(50% + ${patternSeparation}vw / var(--page-scale, 1))) scale(${patternScale})`,
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

          <Countdown />
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
          {signedIn ? (
            <button type="button" className={styles.registerBtn} onClick={handleExplore}>
              Explore
            </button>
          ) : (
            <Link href="/signup" className={styles.registerBtn}>
              Register Now
            </Link>
          )}
        </div>

        <button
          type="button"
          className={styles.scrollHint}
          onClick={handleScrollHint}
          aria-label="Scroll ke bawah"
          tabIndex={hintOpacity > 0.5 ? 0 : -1}
          style={{ opacity: hintOpacity, pointerEvents: hintOpacity > 0.5 ? "auto" : "none" }}
        >
          <span className={styles.scrollHintText}>Scroll ke bawah</span>
          <svg className={styles.scrollHintChevron} viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
            <path d="M4 8l8 8 8-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

      </div>
    </section>
  )
}