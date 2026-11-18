import type { ReactNode } from "react"

import styles from "./PanelHifi.module.css"

interface PanelHifiProps {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}

export default function PanelHifi({ title, subtitle, action, children }: PanelHifiProps) {
  return (
    <section className={styles.panel}>
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
