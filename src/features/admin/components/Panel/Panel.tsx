import styles from "./Panel.module.css"

interface PanelProps {
  title: string
  subtitle?: string
  /** Divisions this panel reports on; used by the dashboard filter. */
  divisions?: string[]
  action?: React.ReactNode
  full?: boolean
  children: React.ReactNode
}

export default function Panel({ title, subtitle, divisions, action, full, children }: PanelProps) {
  return (
    <section
      className={`${styles.panel} ${full ? styles.full : ""}`}
      data-divisions={divisions?.join(" ")}
    >
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}
