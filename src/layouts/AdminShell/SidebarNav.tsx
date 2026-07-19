"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  FileText,
  Handshake,
  LayoutDashboard,
  Settings,
  Trophy,
  Users,
  CalendarDays,
} from "lucide-react"
import styles from "./SidebarNav.module.css"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number }>
  /** False for the six routes that render a not-in-MVP placeholder. */
  live: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, live: true },
  { href: "/admin/users", label: "Users", icon: Users, live: false },
  { href: "/admin/events", label: "Events", icon: CalendarDays, live: false },
  { href: "/admin/competition", label: "Competition", icon: Trophy, live: false },
  { href: "/admin/content", label: "Content", icon: FileText, live: false },
  { href: "/admin/partners", label: "Partners", icon: Handshake, live: false },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, live: true },
  { href: "/admin/settings", label: "Settings", icon: Settings, live: false },
]

export default function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className={styles.nav} aria-label="Admin sections">
      <ul className={styles.list}>
        {NAV_ITEMS.map((item) => {
          // Exact match for /admin so it does not stay active on every child route.
          const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`${styles.link} ${isActive ? styles.active : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={16} />
                <span className={styles.label}>{item.label}</span>
                {/* Text marker, not colour — the palette has no status hues. */}
                {!item.live && <span className={styles.badge}>soon</span>}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
