import type { ReactNode } from "react"

import NavbarHifi from "@/shared/components/Navbar/NavbarHifi/NavbarHifi"

import styles from "./AdminFrame.module.css"
import AdminMobileNav from "./AdminMobileNav"
import AdminSidebarHifi from "./AdminSidebarHifi"

interface AdminFrameProps {
  children: ReactNode
  /** False for booth staff: the menus show only what they can open. */
  isAdmin?: boolean
  /** Highlight this menu item instead of the one matching the URL. */
  activeHref?: string
}

/**
 * The admin app frame shared by every /admin page (src/app/admin/layout.tsx) and the /admin-hifi
 * mocks (AdminShellHifi): site navbar on top, admin sidebar on the left (desktop), section chips
 * (mobile), content on the right. Pages bring their own header (PageHeader / AdminPageHeader).
 */
export default function AdminFrame({ children, isAdmin = true, activeHref }: AdminFrameProps) {
  return (
    <>
      <NavbarHifi solidOnMobile />

      <div className={styles.shell}>
        <div className={styles.sidebarSlot}>
          <AdminSidebarHifi activeHref={activeHref} isAdmin={isAdmin} />
        </div>

        <main className={styles.main}>
          <AdminMobileNav activeHref={activeHref} isAdmin={isAdmin} />
          {children}
        </main>
      </div>
    </>
  )
}
