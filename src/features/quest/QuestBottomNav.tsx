import Link from "next/link"
import { Gift, Map, Medal, ScanLine, ShieldQuestion, Star } from "lucide-react"

import styles from "./QuestBottomNav.module.css"

export type QuestTab = "quests" | "map" | "scan" | "board" | "rewards"

/*
  Lima tab, masing-masing 80,4 lebar (402 / 5) — Figma I3429:17546;620:1382.

  Board, Rewards dan Map sudah menunjuk halaman yang ada. Quests dan Scan
  BELUM: halamannya memang belum dibuat. Href-nya sengaja tetap ditulis
  supaya gagal dengan jelas kalau diklik, bukan diam-diam mendarat di tempat
  lain — dan supaya kelihatan apa yang masih kurang.
*/
const TAB: { key: QuestTab; label: string; href: string; Icon: typeof Map }[] = [
  { key: "quests", label: "Quests", href: "/quest", Icon: ShieldQuestion },
  { key: "map", label: "Map", href: "/event-map", Icon: Map },
  { key: "scan", label: "Scan", href: "/quest/scan", Icon: Star },
  { key: "board", label: "Board", href: "/quest/leaderboard", Icon: Medal },
  { key: "rewards", label: "Rewards", href: "/quest/rewards", Icon: Gift },
]

interface QuestBottomNavProps {
  active: QuestTab
  /** Tombol scan bundar di tengah. Tanpa href, tombolnya tetap digambar mati. */
  scanHref?: string
}

/**
 * Navigasi bawah untuk section quest — Figma node 3429:17546.
 *
 * Ini kerangka tersendiri, BUKAN navbar situs: lima tujuannya (Quests, Map,
 * Scan, Board, Rewards) tidak ada satu pun di navbar utama. Jadi halaman quest
 * tidak memakai NavbarHifi.
 */
export default function QuestBottomNav({ active, scanHref }: QuestBottomNavProps) {
  return (
    <nav className={styles.bar} aria-label="Navigasi quest">
      {/* Latar bar selebar layar, isinya dibatasi selebar kanvas dan
          ditengahkan — sama seperti kolom isi halamannya. */}
      <div className={styles.inner}>
        <ul className={styles.items}>
          {TAB.map(({ key, label, href, Icon }) => {
            const aktif = key === active
            return (
              <li key={key} className={styles.item}>
                <Link
                  href={href}
                  className={`${styles.link} ${aktif ? styles.linkActive : ""}`}
                  aria-current={aktif ? "page" : undefined}
                >
                  <Icon className={styles.icon} size={24} strokeWidth={1.5} aria-hidden />
                  <span className={styles.label}>{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        {/*
          Tombol scan melayang di atas bar (y 917 vs bar 921), jadi dia menimpa
          tab Scan yang ada di belakangnya — begitu juga di rancangannya.
        */}
        {scanHref ? (
          <Link href={scanHref} className={styles.fab} aria-label="Scan QR">
            <ScanLine size={24} strokeWidth={1.5} aria-hidden />
          </Link>
        ) : null}

        {/* Batang home iOS — ada di rancangan, jadi ikut digambar. */}
        <span className={styles.homeIndicator} aria-hidden />
      </div>
    </nav>
  )
}
