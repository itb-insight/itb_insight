import type { ReactNode } from "react"

import NavbarHifi from "@/shared/components/Navbar/NavbarHifi/NavbarHifi"
import styles from "./AdminShellHifi.module.css"
import AdminSidebarHifi from "./AdminSidebarHifi"

interface AdminShellHifiProps {
  title: string
  subtitle?: string
  meta?: ReactNode
  activeHref?: string
  children: ReactNode
}

export default function AdminShellHifi({
  title,
  subtitle,
  meta,
  activeHref,
  children,
}: AdminShellHifiProps) {
  return (
    <>
      <NavbarHifi />

      <div className={styles.shell}>
        <div className={styles.sidebarSlot}>
          <AdminSidebarHifi activeHref={activeHref} />
        </div>

        <main className={styles.main}>
          <header className={styles.header}>
            <div className={styles.heading}>
              <h1 className={styles.title}>{title}</h1>
              {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            </div>

            {meta ? <div className={styles.meta}>{meta}</div> : null}
          </header>

          <div className={styles.content}>{children}</div>
        </main>
      </div>
    </>
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
