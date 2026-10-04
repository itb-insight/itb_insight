import NavbarHifi from "@/shared/components/Navbar/NavbarHifi/NavbarHifi"
import FooterHifi from "@/shared/components/Footer/FooterHifi/FooterHifi"
import DashboardSidebar from "@/shared/components/DashboardSidebar/DashboardSidebar"
import styles from "./layout.module.css"

const SIDEBAR_TOP = 124
const MOBILE_NAVBAR_HEIGHT = 95

// Every dashboard route shares the hifi navbar, the floating sidebar and the footer.
// Pages only render their own content: `.content` reserves the sidebar column on
// desktop (exposed as --sidebar-offset so a page can pull its decor back under the
// sidebar). On mobile the sidebar collapses into an in-flow dropdown whose height is
// exposed as --mobile-nav-space for the same reason.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <NavbarHifi />
      <DashboardSidebar
        topOffset={SIDEBAR_TOP}
        mobileMode="dropdown"
        mobileTopOffset={MOBILE_NAVBAR_HEIGHT}
        translucent
      />
      <div className={styles.content}>{children}</div>
      <FooterHifi />
    </div>
  )
}
