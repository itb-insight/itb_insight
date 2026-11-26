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
  Gamepad2,
  ScanLine,
} from "lucide-react"
import styles from "./SidebarNav.module.css"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number }>
  /** False for the six routes that render a not-in-MVP placeholder. */
  live: boolean
}

/*
  Quest Ops ada di sini, bukan di AdminShellHifi/adminNav.ts: halamannya
  (/admin/quest-ops) dibungkus layout /admin, yaitu shell lo-fi ini.

  Hanya muncul saat development, sama seperti menu Quest di navbar situs —
  halamannya notFound() di produksi karena isinya masih data dummy
  (src/features/quest-ops/mockData.ts), jadi menunya di produksi cuma akan
  menuju 404. Hapus syarat ini bersamaan dengan gerbang di halaman itu.

  `live: true` karena UI-nya sudah lengkap: lencana "soon" dipakai untuk
  halaman yang masih placeholder, dan ini bukan salah satunya.
*/
const QUEST_OPS: NavItem[] =
  process.env.NODE_ENV === "production"
    ? []
    : [{ href: "/admin/quest-ops", label: "Quest Ops", icon: Gamepad2, live: true }]

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, live: true },
  { href: "/admin/users", label: "Users", icon: Users, live: false },
  { href: "/admin/events", label: "Events", icon: CalendarDays, live: false },
  { href: "/admin/competition", label: "Competition", icon: Trophy, live: false },
  { href: "/admin/content", label: "Content", icon: FileText, live: false },
  { href: "/admin/partners", label: "Partners", icon: Handshake, live: false },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, live: true },
  { href: "/admin/qr-points", label: "QR Points (test)", icon: ScanLine, live: true },
  ...QUEST_OPS,
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
