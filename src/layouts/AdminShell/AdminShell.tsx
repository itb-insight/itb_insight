import Navbar from "@/shared/components/Navbar/Navbar"
import SidebarNav from "./SidebarNav"
import styles from "./AdminShell.module.css"

interface AdminShellProps {
  children: React.ReactNode
}

/**
 * Sidebar app shell for the admin area. A layout primitive, not a dashboard
 * feature — it knows nothing about analytics data.
 *
 * The shared landing header sits fixed across the top; the sidebar and content
 * are offset below it (see AdminShell.module.css). The header is rendered solid
 * here because the admin surface is dense — a transparent overlay would bleed
 * the panels underneath through the nav.
 */
export default function AdminShell({ children }: AdminShellProps) {
  return (
    <>
      <Navbar isSolid />
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <SidebarNav />
        </aside>

        <div className={styles.main}>{children}</div>
      </div>
    </>
  )
}
