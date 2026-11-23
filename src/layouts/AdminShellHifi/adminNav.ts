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

/*
  SEMENTARA: href menunjuk ke /admin-hifi/*, bukan /admin/*.

  Halaman /admin/* yang asli masih memakai AdminShell lo-fi dan belum dipindah,
  sementara /admin-hifi/* sudah ada dan bisa dijalani. Begitu tim sepakat
  memindahkannya, cukup ganti prefix di berkas ini — tidak ada tempat lain yang
  menulis href menu.

  Competition dan kedua Scanner belum punya halaman; href-nya dibiarkan apa
  adanya supaya ketahuan kalau diklik, bukan diam-diam mendarat di tempat lain.
*/
export const ADMIN_NAV: AdminNavSection[] = [
  {
    title: "Data",
    items: [
      { label: "User", href: "/admin-hifi/user", icon: HomeIcon },
      { label: "Competition", href: "/admin/competition", icon: TrophyIcon },
      { label: "D-Day", href: "/admin-hifi/d-day", icon: CalendarIcon },
      { label: "Feedback", href: "/admin-hifi/feedback", icon: ChatBubbleIcon },
      { label: "Sponsor", href: "/admin-hifi/sponsor", icon: CoinIcon },
      { label: "Web", href: "/admin-hifi/web", icon: InternetIcon },
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
