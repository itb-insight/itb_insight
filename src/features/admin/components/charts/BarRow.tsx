import styles from "./Bars.module.css"

interface BarRowProps {
  label: string
  value: string
  /** 0–100. Geometry is data-driven, hence the inline style. */
  pct: number
  /** Override the fill token; defaults to the single-series --chart-1. */
  fillVar?: string
}

export default function BarRow({ label, value, pct, fillVar = "var(--chart-1)" }: BarRowProps) {
  const clamped = Math.max(0, Math.min(100, pct))

  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      <div
        className={styles.track}
        role="img"
        aria-label={`${label}: ${value}, ${Math.round(clamped)}% of maximum`}
      >
        <div className={styles.fill} style={{ width: `${clamped}%`, backgroundColor: fillVar }} />
      </div>
    </div>
  )
}
