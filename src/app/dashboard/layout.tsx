import NavbarHifi from "@/shared/components/Navbar/NavbarHifi/NavbarHifi"
import FooterHifi from "@/shared/components/Footer/FooterHifi/FooterHifi"
import DashboardSidebar from "@/shared/components/DashboardSidebar/DashboardSidebar"
import DashboardBackground from "@/shared/components/DashboardBackground/DashboardBackground"
import styles from "./layout.module.css"

const SIDEBAR_TOP = 124
const MOBILE_NAVBAR_HEIGHT = 95

// Every dashboard route shares the decor background, the hifi navbar, the floating
// sidebar and the footer.
// Pages only render their own content: `.content` reserves the sidebar column on
// desktop (exposed as --sidebar-offset). On mobile the sidebar collapses into an in-flow
// dropdown whose height is exposed as --mobile-nav-space.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <DashboardBackground />
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
