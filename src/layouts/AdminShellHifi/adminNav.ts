import type { ComponentType } from "react"
import { BarChart3, FileText, Gamepad2, Handshake, ScanLine, Settings, Users } from "lucide-react"

import { BOOTH_SECTION_PATH } from "@/lib/admin-nav"

import {
  CalendarIcon,
  ChatBubbleIcon,
  CoinIcon,
  HomeIcon,
  InternetIcon,
  ShopAltIcon,
  TrophyIcon,
} from "./NavIcons"

export interface AdminNavItem {
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
  /** Who sees it. "booth": booth staff too (role_b 'booth'); default: admins only. */
  access?: "booth"
  /** Placeholder page (NotInMvp): marked "soon". */
  soon?: boolean
}

export interface AdminNavSection {
  /** Judul kecil di atas kelompok, #CCDDFF 20/24. */
  title: string
  items: AdminNavItem[]
}

const isProduction = process.env.NODE_ENV === "production"

/*
  The one admin menu: the sidebar (desktop) and the section chips (mobile) of every /admin page
  and of the /admin-hifi mocks. Visibility is a convenience only; every page checks access itself
  (src/app/admin/layout.tsx, src/app/admin/(admin-only)/layout.tsx).

  Development only:
  - Quest Ops: its page notFound()s in production (mock data, src/features/quest-ops/mockData.ts).
    Remove the condition together with that gate.
  - "Desain hi-fi": the /admin-hifi/* mock pages, which also 404 in production.
*/
export const ADMIN_NAV: AdminNavSection[] = [
  {
    title: "Data",
    items: [
      { label: "Dashboard", href: "/admin", icon: HomeIcon, access: "booth" },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Scanner",
    items: [
      { label: "Booth", href: BOOTH_SECTION_PATH, icon: ShopAltIcon, access: "booth" },
      { label: "QR Points (test)", href: "/admin/qr-points", icon: ScanLine },
      ...(isProduction ? [] : [{ label: "Quest Ops", href: "/admin/quest-ops", icon: Gamepad2 }]),
    ],
  },
  {
    title: "Kelola",
    items: [
      { label: "Users", href: "/admin/users", icon: Users, soon: true },
      { label: "Events", href: "/admin/events", icon: CalendarIcon, soon: true },
      { label: "Competition", href: "/admin/competition", icon: TrophyIcon, soon: true },
      { label: "Content", href: "/admin/content", icon: FileText, soon: true },
      { label: "Partners", href: "/admin/partners", icon: Handshake, soon: true },
      { label: "Settings", href: "/admin/settings", icon: Settings, soon: true },
    ],
  },
  ...(isProduction
    ? []
    : [
        {
          title: "Desain hi-fi (mock)",
          items: [
            { label: "User", href: "/admin-hifi/user", icon: HomeIcon },
            { label: "D-Day", href: "/admin-hifi/d-day", icon: CalendarIcon },
            { label: "Feedback", href: "/admin-hifi/feedback", icon: ChatBubbleIcon },
            { label: "Sponsor", href: "/admin-hifi/sponsor", icon: CoinIcon },
            { label: "Web", href: "/admin-hifi/web", icon: InternetIcon },
          ],
        },
      ]),
]

/** The menu this user sees: everything for admins, only the "booth" items for booth staff. */
export function adminNavFor(isAdmin: boolean): AdminNavSection[] {
  if (isAdmin) return ADMIN_NAV
  return ADMIN_NAV.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.access === "booth"),
  })).filter((section) => section.items.length > 0)
}

/** /admin is active only on itself, every other item on its subtree too. */
export function isNavItemActive(href: string, current: string): boolean {
  if (href === "/admin") return current === "/admin"
  return current === href || current.startsWith(`${href}/`)
}
