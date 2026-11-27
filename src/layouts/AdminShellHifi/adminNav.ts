import type { ComponentType } from "react"
import { BarChart3, DoorOpen, FileText, Gamepad2, Handshake, ScanLine, Settings, Users } from "lucide-react"

import { BOOTH_SECTION_PATH, DDAY_PATH, GATE_SECTION_PATH } from "@/lib/admin-nav"

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
  /**
   * Who sees it besides admins: "booth" = booth staff (role_b 'booth'), "gate" = gate staff,
   * "staff" = every staff member (staffAccessFor in src/lib/admin-access.ts).
   */
  access?: "booth" | "gate" | "staff"
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
      { label: "D-Day", href: DDAY_PATH, icon: CalendarIcon, access: "staff" },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Scanner",
    items: [
      { label: "Gate", href: GATE_SECTION_PATH, icon: DoorOpen, access: "gate" },
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
            { label: "Feedback", href: "/admin-hifi/feedback", icon: ChatBubbleIcon },
            { label: "Sponsor", href: "/admin-hifi/sponsor", icon: CoinIcon },
            { label: "Web", href: "/admin-hifi/web", icon: InternetIcon },
          ],
        },
      ]),
]

/** What a user can open under /admin (from getAdminAccess). */
export type NavSections = { isAdmin: boolean; booth: boolean; gate: boolean; staff: boolean }
export const ALL_SECTIONS: NavSections = { isAdmin: true, booth: true, gate: true, staff: true }

/** The menu this user sees: everything for admins, otherwise only the staff / booth / gate items they have. */
export function adminNavFor(sections: NavSections): AdminNavSection[] {
  if (sections.isAdmin) return ADMIN_NAV
  return ADMIN_NAV.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) =>
        (item.access === "booth" && sections.booth) ||
        (item.access === "gate" && sections.gate) ||
        (item.access === "staff" && sections.staff),
    ),
  })).filter((section) => section.items.length > 0)
}

/** /admin is active only on itself, every other item on its subtree too. */
export function isNavItemActive(href: string, current: string): boolean {
  if (href === "/admin") return current === "/admin"
  return current === href || current.startsWith(`${href}/`)
}
