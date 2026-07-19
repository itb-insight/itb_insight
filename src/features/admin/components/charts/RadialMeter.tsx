import styles from "./RadialMeter.module.css"

interface RadialMeterProps {
  /** 0–100 */
  value: number
  caption: string
  /** Text rating shown beside the number — this palette has no status colours. */
  rating: string
}

const RADIUS = 38
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * Single-value meter. Not a chart with series — one number, one arc, so it
 * uses --chart-1 and needs no legend.
 */
export default function RadialMeter({ value, caption, rating }: RadialMeterProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const offset = CIRCUMFERENCE * (1 - clamped / 100)

  return (
    <div className={styles.wrap}>
      <svg width="90" height="90" viewBox="0 0 90 90" role="img" aria-label={`${caption}: ${clamped}%`}>
        <circle cx="45" cy="45" r={RADIUS} fill="none" stroke="var(--chart-track)" strokeWidth="8" />
        <circle
          cx="45"
          cy="45"
          r={RADIUS}
          fill="none"
          stroke="var(--chart-1)"
          strokeWidth="8"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
        />
      </svg>

      <div>
        <div className={styles.value}>{clamped}%</div>
        <div className={styles.caption}>{caption}</div>
        <div className={styles.rating}>{rating}</div>
      </div>
    </div>
  )
}
