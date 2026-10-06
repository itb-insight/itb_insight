"use client"

import { useEffect, useState } from "react"

import cardStyles from "./HomeCard.module.css"
import styles from "./CountdownCard.module.css"
import { COUNTDOWN_TARGET } from "./homeConfig"
import { useServerClock } from "./serverClock"

const PLACEHOLDER = "00:00:00"

const pad = (value: number) => String(value).padStart(2, "0")

/** Whole minutes left, split into days : hours : minutes. Clamped at zero. */
function format(targetMs: number, nowMs: number) {
  const totalMinutes = Math.max(0, Math.floor((targetMs - nowMs) / 60_000))
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  return `${pad(days)}:${pad(hours)}:${pad(totalMinutes % 60)}`
}

interface CountdownCardProps {
  target?: string
  serverNow?: number
}

export default function CountdownCard({
  target = COUNTDOWN_TARGET,
  serverNow,
}: CountdownCardProps) {
  const [remaining, setRemaining] = useState<string | null>(null)
  const now = useServerClock(serverNow)

  useEffect(() => {
    const targetMs = new Date(target).getTime()
    const tick = () => setRemaining(format(targetMs, now()))

    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [target, now, serverNow])

  return (
    <section className={`${cardStyles.surface} ${styles.card}`}>
      <h2 className={styles.label}>Countdown</h2>
      {}
      <p className={styles.value}>{remaining ?? PLACEHOLDER}</p>
    </section>
  )
}
