"use client"

import { useEffect, useState } from "react"

import cardStyles from "./HomeCard.module.css"
import styles from "./CountdownCard.module.css"
import { COUNTDOWN_TARGET } from "./homeConfig"
import { useServerClock } from "./serverClock"

const pad = (value: number) => String(value).padStart(2, "0")

type Remaining = { days: string; hours: string; minutes: string } | "today" | "over"

/** D-Day is the whole of the target's day in Jakarta; after it the countdown is over. */
export function remaining(targetMs: number, nowMs: number): Remaining {
  if (nowMs >= targetMs) {
    const dayOf = (ms: number) => new Date(ms).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
    return dayOf(nowMs) === dayOf(targetMs) ? "today" : "over"
  }
  const totalMinutes = Math.floor((targetMs - nowMs) / 60_000)
  return {
    days: pad(Math.floor(totalMinutes / 1440)),
    hours: pad(Math.floor((totalMinutes % 1440) / 60)),
    minutes: pad(totalMinutes % 60),
  }
}

interface CountdownCardProps {
  target?: string
  serverNow?: number
}

/** Counts down to D-Day (COUNTDOWN_TARGET, the same moment as the landing page countdown). */
export default function CountdownCard({ target = COUNTDOWN_TARGET, serverNow }: CountdownCardProps) {
  const [left, setLeft] = useState<Remaining | null>(null)
  const now = useServerClock(serverNow)

  useEffect(() => {
    const targetMs = new Date(target).getTime()
    const tick = () => setLeft(remaining(targetMs, now()))

    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [target, now, serverNow])

  const units = left && typeof left === "object" ? left : { days: "00", hours: "00", minutes: "00" }

  return (
    <section className={`${cardStyles.surface} ${styles.card}`}>
      <h2 className={styles.label}>Countdown to D-Day</h2>

      {left === "today" || left === "over" ? (
        <p className={styles.value}>{left === "today" ? "D-Day!" : "Sampai jumpa!"}</p>
      ) : (
        <div className={styles.units} role="timer" aria-live="off">
          {(
            [
              [units.days, "Hari"],
              [units.hours, "Jam"],
              [units.minutes, "Menit"],
            ] as const
          ).map(([value, unit], i) => (
            <div key={unit} className={styles.unitGroup}>
              {i > 0 && <span className={styles.separator} aria-hidden="true">:</span>}
              <div className={styles.unit}>
                <span className={styles.value}>{value}</span>
                <span className={styles.unitLabel}>{unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
