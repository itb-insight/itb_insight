"use client"

import { useEffect, useState } from "react"

import styles from "./quest.module.css"

interface FlashBannerProps {
  title: string
  description: string
  secondsLeft: number
}

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export default function FlashBanner({ title, description, secondsLeft }: FlashBannerProps) {
  const [remaining, setRemaining] = useState(secondsLeft)

  useEffect(() => {
    if (remaining <= 0) return
    const timer = window.setTimeout(() => setRemaining((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [remaining])

  if (remaining <= 0) return null

  return (
    <section className={styles.flash} aria-label={title}>
      <span className={styles.flashTime}>{formatClock(remaining)}</span>
      <div>
        <p className={styles.flashTitle}>{title}</p>
        <p className={styles.flashText}>{description}</p>
      </div>
    </section>
  )
}
