import styles from "./Bars.module.css"

interface InlineBarProps {
  /** 0–100 */
  pct: number
}

/**
 * Small bar rendered beside a table value. Decorative: the number it sits next
 * to is the accessible source of truth, so this is aria-hidden.
 */
export default function InlineBar({ pct }: InlineBarProps) {
  const clamped = Math.max(0, Math.min(100, pct))

  return (
    <span className={styles.inlineTrack} aria-hidden="true">
      <span className={styles.inlineFill} style={{ width: `${clamped}%` }} />
    </span>
  )
}
