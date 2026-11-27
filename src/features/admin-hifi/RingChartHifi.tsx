import type { CSSProperties } from "react"

import PanelHifi from "./PanelHifi"
import styles from "./RingChartHifi.module.css"

interface RingChartHifiProps {
  title: string
  subtitle?: string
  value: number
  centerLabel: string
  legend: { on: string; off: string }
  total?: string
}

export default function RingChartHifi({
  title,
  subtitle,
  value,
  centerLabel,
  legend,
  total,
}: RingChartHifiProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const arcStyle = { "--sweep": `${clamped / 100}turn` } as CSSProperties

  return (
    <PanelHifi title={title} subtitle={subtitle}>
      <div className={styles.body}>
        <div
          className={styles.ringWrap}
          role="img"
          aria-label={`${clamped}% ${centerLabel}${total ? `. ${total}` : ""}`}
        >
          <div className={styles.ring}>
            <div className={styles.arc} style={arcStyle} />
          </div>

          <div className={styles.center}>
            <p className={styles.value}>{clamped}%</p>
            <p className={styles.centerLabel}>{centerLabel}</p>
          </div>
        </div>

        <ul className={styles.legend}>
          <li className={styles.legendRow}>
            <span className={`${styles.swatch} ${styles.swatchOn}`} />
            {legend.on}
          </li>
          <li className={styles.legendRow}>
            <span className={`${styles.swatch} ${styles.swatchOff}`} />
            {legend.off}
          </li>
          {total ? (
            <li>
              <p className={styles.total}>{total}</p>
            </li>
          ) : null}
        </ul>
      </div>
    </PanelHifi>
  )
}
