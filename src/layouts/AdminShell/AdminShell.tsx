import Link from "next/link"
import SidebarNav from "./SidebarNav"
import styles from "./AdminShell.module.css"

interface AdminShellProps {
  children: React.ReactNode
}

/**
 * Sidebar app shell for the admin area. A layout primitive, not a dashboard
 * feature — it knows nothing about analytics data.
 */
export default function AdminShell({ children }: AdminShellProps) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>ITB</span>
          <span className={styles.brandName}>Insight</span>
        </Link>
        <SidebarNav />
      </aside>

      <div className={styles.main}>{children}</div>
    </div>
  )
}
