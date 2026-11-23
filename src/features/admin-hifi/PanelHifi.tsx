import type { CSSProperties, ReactNode } from "react"

import styles from "./PanelHifi.module.css"

interface PanelHifiProps {
  title: string
  subtitle?: string
  action?: ReactNode
  /**
   * Jarak kepala -> isi. Default 24 (var --admin-panel-gap). Kartu "Semua
   * Feedback" di Figma memakai 20, jadi perlu bisa ditimpa.
   */
  gap?: number
  children: ReactNode
}

export default function PanelHifi({ title, subtitle, action, gap, children }: PanelHifiProps) {
  return (
    <section
      className={styles.panel}
      style={gap === undefined ? undefined : ({ "--admin-panel-gap": `${gap}px` } as CSSProperties)}
    >
      <header className={styles.header}>
        <div className={styles.heading}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
        {action ? <div className={styles.action}>{action}</div> : null}
      </header>

      <div className={styles.body}>{children}</div>
    </section>
  )
}
