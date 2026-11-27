import type { ComponentType } from "react"
import { BarChart3, DoorOpen, FileText, Gamepad2, Gift, Handshake, ImageIcon, KeyRound, ScanLine, Settings, UserRound, Users } from "lucide-react"

import { BOOTH_ACCESS_PATH, BOOTH_SECTION_PATH, DDAY_PATH, GATE_SECTION_PATH } from "@/lib/admin-nav"

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
   * Who sees it besides admins: "booth" = booth staff (role_b 'booth' or assigned booths),
   * "boothManager" = booth stakeholders (canManageBoothAccess), "gate" = gate staff,
   * "staff" = every staff member (staffAccessFor in src/lib/admin-access.ts).
   */
  access?: "booth" | "boothManager" | "gate" | "staff" | "reviewer" | "prizeDesk"
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
  - QR Points (test): wrote real points through the old award flow; off in production since
    Insight Arcade went live (migration 0030).
  The /admin-hifi/* design mocks (404 in production) are no longer in the menu: /admin/web,
  /admin/registrations, /admin/feedback and /admin/sponsor are their real versions.
*/
export const ADMIN_NAV: AdminNavSection[] = [
  {
    title: "Data",
    items: [
      { label: "Dashboard", href: "/admin", icon: HomeIcon, access: "booth" },
      { label: "D-Day", href: DDAY_PATH, icon: CalendarIcon, access: "staff" },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { label: "Web", href: "/admin/web", icon: InternetIcon },
      { label: "User", href: "/admin/registrations", icon: UserRound },
      { label: "Feedback", href: "/admin/feedback", icon: ChatBubbleIcon },
      { label: "Sponsor", href: "/admin/sponsor", icon: CoinIcon },
    ],
  },
  {
    title: "Scanner",
    items: [
      { label: "Gate", href: GATE_SECTION_PATH, icon: DoorOpen, access: "gate" },
      { label: "Booth", href: BOOTH_SECTION_PATH, icon: ShopAltIcon, access: "booth" },
      { label: "Akses Booth", href: BOOTH_ACCESS_PATH, icon: KeyRound, access: "boothManager" },
      { label: "Review Arcade", href: "/admin/arcade-review", icon: ImageIcon, access: "reviewer" },
      { label: "Meja Hadiah", href: "/admin/prizes", icon: Gift, access: "prizeDesk" },
      { label: "Hasil Arcade", href: "/admin/arcade-results", icon: TrophyIcon },
      ...(isProduction
        ? []
        : [
            { label: "QR Points (test)", href: "/admin/qr-points", icon: ScanLine },
            { label: "Quest Ops", href: "/admin/quest-ops", icon: Gamepad2 },
          ]),
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
]

/** What a user can open under /admin (from getAdminAccess). */
export type NavSections = {
  isAdmin: boolean
  booth: boolean
  boothManager: boolean
  gate: boolean
  staff: boolean
  reviewer?: boolean
  prizeDesk?: boolean
}
export const ALL_SECTIONS: NavSections = { isAdmin: true, booth: true, boothManager: true, gate: true, staff: true, reviewer: true, prizeDesk: true }

/** The menu this user sees: everything for admins, otherwise only the staff / booth / gate items they have. */
export function adminNavFor(sections: NavSections): AdminNavSection[] {
  if (sections.isAdmin) return ADMIN_NAV
  return ADMIN_NAV.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) =>
        (item.access === "booth" && sections.booth) ||
        (item.access === "boothManager" && sections.boothManager) ||
        (item.access === "reviewer" && sections.reviewer) ||
        (item.access === "prizeDesk" && sections.prizeDesk) ||
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
