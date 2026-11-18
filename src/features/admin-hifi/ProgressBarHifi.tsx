import type { CSSProperties } from "react"

import styles from "./ProgressBarHifi.module.css"

interface ProgressBarHifiProps {
  /** 0–100 */
  value: number
  /** Nama baris, untuk pembaca layar */
  label: string
}

export default function ProgressBarHifi({ value, label }: ProgressBarHifiProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const fillStyle = { "--value": `${clamped}%` } as CSSProperties

  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
    >
      <div className={styles.fill} style={fillStyle} />
    </div>
  )
}
