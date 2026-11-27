import type { ReactNode } from "react"

import QuestBottomNav, { type QuestTab } from "./QuestBottomNav"
import QuestDesktopHeader from "./QuestDesktopHeader"
import QuestMobileHeader from "./QuestMobileHeader"
import styles from "./quest-shared.module.css"

/**
 * Pembungkus setiap halaman quest: latar gradien selebar layar, lalu header
 * quest (logo, poin, hamburger) di atas isi halamannya.
 *
 * Header-nya bertukar di 901px, patahan yang sama dengan navbar situs
 * (NavbarHifi.module.css) — bukan angka baru. Yang desktop melintang selebar
 * layar karena tautannya tautan situs, sementara yang mobile ikut lebar kolom.
 *
 * Tingginya dipegang --quest-header-h di globals.css (beda per patahan: yang
 * mobile 99, yang desktop lebih tinggi), dan akar tiap layar memakai
 * `calc(100dvh - var(--quest-header-h))` supaya satu layar penuh tetap pas satu
 * layar — bukan setinggi header lebih lalu tergulung.
 *
 * Navigasi bawah juga dipegang di sini, bukan di tiap layar: supaya latarnya
 * bisa melintang selebar layar seperti header. Kalau dia tinggal di dalam kolom
 * isi, latarnya ikut terbatas — dan di peta dia bahkan tidak bisa keluar sama
 * sekali karena akarnya `overflow: hidden`.
 *
 * Tanpa `activeTab` nav-nya tidak digambar (How to Play dan detail quest).
 *
 * TIDAK dipakai /quest/preview: halaman itu memang papan frame telanjang untuk
 * perbandingan per piksel, chrome tambahan justru merusak gunanya.
 */
export default function QuestPageShell({
  children,
  activeTab,
  questsHref,
}: {
  children: ReactNode
  /** Tab yang menyala. Tanpa ini navigasi bawahnya tidak digambar. */
  activeTab?: QuestTab
  /** Tujuan tab Quests, kalau bukan /quest. */
  questsHref?: string
}) {
  return (
    <div className={styles.shell}>
      <div className={styles.headerMobile}>
        <QuestMobileHeader />
      </div>
      <div className={styles.headerDesktop}>
        <QuestDesktopHeader />
      </div>
      {children}
      {activeTab ? (
        <QuestBottomNav
          active={activeTab}
          hrefs={questsHref ? { quests: questsHref } : undefined}
        />
      ) : null}
    </div>
  )
}
