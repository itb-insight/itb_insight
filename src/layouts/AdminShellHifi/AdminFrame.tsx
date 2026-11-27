import type { ReactNode } from "react"

import NavbarHifi from "@/shared/components/Navbar/NavbarHifi/NavbarHifi"

import styles from "./AdminFrame.module.css"
import AdminMobileNav from "./AdminMobileNav"
import AdminSidebarHifi from "./AdminSidebarHifi"

interface AdminFrameProps {
  children: ReactNode
  /** False for booth staff: the menus show only what they can open. */
  isAdmin?: boolean
  /** Non-admins: has the Booth section / the booth access page / the Gate section / the staff pages (D-Day). */
  booth?: boolean
  boothManager?: boolean
  gate?: boolean
  staff?: boolean
  /** Highlight this menu item instead of the one matching the URL. */
  activeHref?: string
}

/**
 * The admin app frame shared by every /admin page (src/app/admin/layout.tsx) and the /admin-hifi
 * mocks (AdminShellHifi): site navbar on top, admin sidebar on the left (desktop), section chips
 * (mobile), content on the right. Pages bring their own header (PageHeader / AdminPageHeader).
 */
export default function AdminFrame({
  children,
  isAdmin = true,
  booth = false,
  boothManager = false,
  gate = false,
  staff = false,
  activeHref,
}: AdminFrameProps) {
  const sections = { isAdmin, booth, boothManager, gate, staff }
  return (
    <>
      <NavbarHifi solidOnMobile />

      <div className={styles.shell}>
        <div className={styles.sidebarSlot}>
          <AdminSidebarHifi activeHref={activeHref} sections={sections} />
        </div>

        <main className={styles.main}>
          <AdminMobileNav activeHref={activeHref} sections={sections} />
          {children}
        </main>
      </div>
    </>
  )
}
