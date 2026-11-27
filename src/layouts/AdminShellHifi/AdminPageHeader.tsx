import type { ReactNode } from "react"

import styles from "./AdminPageHeader.module.css"

interface AdminPageHeaderProps {
  title: string
  subtitle?: string
  /** Right-hand pills (AdminPill), e.g. "Diperbarui 12 detik lalu". */
  meta?: ReactNode
}

/** Page title block of the hi-fi admin: gradient title, subtitle, pills on the right. */
export default function AdminPageHeader({ title, subtitle, meta }: AdminPageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.heading}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>

      {meta ? <div className={styles.meta}>{meta}</div> : null}
    </header>
  )
}

export function AdminPill({ children, dot }: { children: ReactNode; dot?: boolean }) {
  return (
    <span className={styles.pill}>
      {dot ? <span className={styles.dot} /> : null}
      {children}
    </span>
  )
}
