import type { ReactNode } from "react"

import gb from "./GradientBorder.module.css"
import styles from "./GlassPanel.module.css"

interface GlassPanelProps {
  title: string
  subtitle?: string
  action?: ReactNode
  toolbar?: ReactNode
  children: ReactNode
}

export default function GlassPanel({ title, subtitle, action, toolbar, children }: GlassPanelProps) {
  return (
    <section className={`${gb.border} ${styles.panel} ${toolbar ? styles.withToolbar : ""}`}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {action && <div className={styles.action}>{action}</div>}
      </header>
      {toolbar && <div className={styles.toolbar}>{toolbar}</div>}
      <div className={styles.body}>{children}</div>
    </section>
  )
}
