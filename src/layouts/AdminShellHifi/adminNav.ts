import type { ComponentType } from "react"

import {
  CalendarIcon,
  ChatBubbleIcon,
  ClosetIcon,
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
}

export interface AdminNavSection {
  /** Judul kecil di atas kelompok, #CCDDFF 20/24. */
  title: string
  items: AdminNavItem[]
}

export const ADMIN_NAV: AdminNavSection[] = [
  {
    title: "Data",
    items: [
      { label: "User", href: "/admin/users", icon: HomeIcon },
      { label: "Competition", href: "/admin/competition", icon: TrophyIcon },
      { label: "D-Day", href: "/admin/d-day", icon: CalendarIcon },
      { label: "Feedback", href: "/admin/feedback", icon: ChatBubbleIcon },
      { label: "Sponsor", href: "/admin/sponsor", icon: CoinIcon },
      { label: "Web", href: "/admin/web", icon: InternetIcon },
    ],
  },
  {
    title: "Scanner",
    items: [
      { label: "Gate", href: "/admin/gate", icon: ClosetIcon },
      { label: "Booth", href: "/admin/booth", icon: ShopAltIcon },
    ],
  },
]
