import type { ReactNode } from "react"

import QuestMobileHeader from "./QuestMobileHeader"
import styles from "./quest-shared.module.css"

/**
 * Pembungkus setiap halaman quest: latar gradien selebar layar, lalu header
 * quest (logo, poin, hamburger) di atas isi halamannya.
 *
 * Tingginya dipegang --quest-header-h di globals.css, dan akar tiap layar
 * memakai `calc(100dvh - var(--quest-header-h))` supaya satu layar penuh tetap
 * pas satu layar — bukan 99px lebih tinggi lalu tergulung.
 *
 * TIDAK dipakai /quest/preview: halaman itu memang papan frame telanjang untuk
 * perbandingan per piksel, chrome tambahan justru merusak gunanya.
 */
export default function QuestPageShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <div className={styles.headerSlot}>
        <QuestMobileHeader />
      </div>
      {children}
    </div>
  )
}
