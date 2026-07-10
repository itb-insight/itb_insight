"use client"

import { useEffect, useState } from "react"
import styles from "./HeroSection.module.css"
import Link from "next/link"

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

export default function HeroSection() {
  const [mounted, setMounted] = useState(false)
  const { days, hours, minutes, seconds } = useCountdown("2026-08-11T00:00:00")

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className={styles.hero}>
      <h2 className={styles.title}>INSIGHT ITB</h2>

      <div className={styles.countdown}>
        <div className={styles.countdownUnit}>
          <span className={styles.countdownNumber}>{mounted ? pad(days) : "00"}</span>
          <span className={styles.countdownLabel}>d</span>
        </div>
        <div className={styles.countdownUnit}>
          <span className={styles.countdownNumber}>{mounted ? pad(hours) : "00"}</span>
          <span className={styles.countdownLabel}>h</span>
        </div>
        <div className={styles.countdownUnit}>
           <span className={styles.countdownNumber}>{mounted ? pad(minutes) : "00"}</span>
           <span className={styles.countdownLabel}>m</span>
        </div>
        <div className={styles.countdownUnit}>
          <span className={styles.countdownNumber}>{mounted ? pad(seconds) : "00"}</span>
          <span className={styles.countdownLabel}>s</span>
        </div>
      </div>

      <p className={styles.description}>
        lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum.
      </p>

      <Link href="/register" className={styles.registerBtn}>
        REGISTER
      </Link>
    </section>
  )
}