/*
  Client component: tombol menunya dioper ke MobileMenuHifi sebagai fungsi
  `trigger`, dan fungsi tidak bisa menyeberang dari server ke client component.
*/
"use client"

import Image from "next/image"
import Link from "next/link"

import MobileMenuHifi from "@/shared/components/Navbar/NavbarHifi/MobileMenuHifi"
import { MenuIcon, TimerIcon } from "./QuestIcons"
import shared from "./quest-shared.module.css"
import styles from "./QuestMobileHeader.module.css"

/*
 * Figma: halaman "Quest" > Section 2 > frame "mobile header" (2104:3055),
 * bagian "Header Mobile": logo, pill timer | poin, tombol menu.
 */

interface QuestMobileHeaderProps {
  /** Poin dompet, sudah diformat, misal "1,240". */
  points?: string
  questHref?: string
  /** Awalan id gradient ikon, unik per header di satu halaman. */
  uid?: string
}

export default function QuestMobileHeader({
  points = "1,240",
  questHref = "/arcade",
  uid = "quest-mobile-header",
}: QuestMobileHeaderProps) {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo} aria-label="ITB Insight">
        <Image
          src="/images/logoinsight-hifi.png"
          alt=""
          width={744}
          height={731}
          sizes="49px"
          loading="eager"
          fetchPriority="high"
        />
      </Link>

      <Link href={questHref} className={styles.pill} aria-label={`Quest, ${points} poin`}>
        <span className={`${styles.pillTimer} ${shared.stroke}`}>
          <TimerIcon uid={`${uid}-timer`} />
        </span>
        <span className={`${styles.pillPoints} ${shared.stroke}`}>
          <span className={`${styles.pillPointsText} ${shared.textNavy}`}>{`${points} PTS`}</span>
        </span>
      </Link>

      {/*
        Isi menunya tidak ada di Section 2 Figma, jadi dipakai menu mobile situs
        (MobileMenuHifi) supaya isinya sama dengan halaman lain. Tombolnya tetap
        tombol rancangan Figma di sini — dioper lewat `trigger`.
      */}
      <MobileMenuHifi
        wrapClassName={styles.menuWrap}
        trigger={(props) => (
          <button
            type="button"
            aria-label="Menu"
            {...props}
            className={`${styles.menu} ${shared.stroke}`}
          >
            <MenuIcon />
          </button>
        )}
      />
    </header>
  )
}
