import Image from "next/image"
import Link from "next/link"

import { MAP_PATH, isMapsDisabled } from "@/lib/maps"
import ComingSoon from "@/shared/components/ComingSoon/ComingSoon"
import { UserIcon } from "./QuestIcons"
import shared from "./quest-shared.module.css"
import styles from "./QuestHeader.module.css"

/*
 * Figma: halaman "Quest" > Section 2 > frame "Header Quest" (2100:26729).
 * Satu header desktop dengan tiga keadaan:
 *   signedOut  "HEADER SIGNED OUT"        tombol START QUEST + Sign In
 *   signedIn   "HEADER SIGNED IN"         QUEST | poin + peringkat, avatar
 *   flash      "HEADER FLASH QUEST LIVE"  FLASH · 2× · waktu | poin, avatar
 */

export type QuestHeaderState = "signedOut" | "signedIn" | "flash"

interface QuestHeaderProps {
  state: QuestHeaderState
  /** Poin dompet, sudah diformat, misal "1,240". */
  points?: string
  /** Peringkat leaderboard, misal "#37". Hanya tampil di keadaan signedIn. */
  rank?: string
  /** Teks pill flash quest, misal "FLASH · 2× · 14:59". */
  flashLabel?: string
  /** Awalan id gradient ikon, unik per header di satu halaman. */
  uid?: string
  startHref?: string
  signInHref?: string
  questHref?: string
  profileHref?: string
}

const LINKS = [
  { href: "/event", label: "Event" },
  { href: "/competition", label: "Competition" },
  { href: "/arcade", label: "Arcade" },
  { href: MAP_PATH, label: "Map" },
]

export default function QuestHeader({
  state,
  points = "1,240",
  rank = "#37",
  flashLabel = "FLASH · 2× · 14:59",
  uid = "quest-header",
  startHref = "/arcade/how-to-play",
  signInHref = "/login",
  questHref = "/arcade",
  profileHref = "/dashboard/profile",
}: QuestHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link href="/" className={styles.logo} aria-label="ITB Insight">
          <Image
            src="/images/logoinsight-hifi.png"
            alt=""
            width={744}
            height={731}
            sizes="62px"
            loading="eager"
            fetchPriority="high"
          />
        </Link>

        <nav className={styles.nav} aria-label="Utama">
          {LINKS.map((link) =>
            link.href === MAP_PATH && isMapsDisabled() ? (
              <ComingSoon key={link.href} className={styles.navLink}>
                <span className={styles.navText}>{link.label}</span>
              </ComingSoon>
            ) : (
              <Link key={link.href} href={link.href} className={styles.navLink}>
                <span className={styles.navText}>{link.label}</span>
              </Link>
            ),
          )}
        </nav>
      </div>

      {state === "signedOut" ? (
        <div className={`${styles.right} ${styles.rightSignedOut}`}>
          <Link href={startHref} className={`${styles.start} ${shared.stroke}`}>
            <span className={`${styles.startText} ${shared.excratch}`}>Start QUEST</span>
          </Link>
          <Link href={signInHref} className={styles.navLink}>
            <span className={styles.navText}>Sign In</span>
          </Link>
        </div>
      ) : (
        <div className={styles.right}>
          <Link
            href={questHref}
            className={`${styles.pill} ${state === "flash" ? styles.pillFlash : ""}`}
            aria-label={
              state === "flash"
                ? `${flashLabel}, ${points} poin`
                : `Quest, ${points} poin, peringkat ${rank}`
            }
          >
            <span className={`${styles.pillLabel} ${shared.stroke}`}>
              <span className={`${styles.pillLabelText} ${shared.excratch}`}>
                {state === "flash" ? withSymbolFallback(flashLabel) : "QUEST"}
              </span>
            </span>
            <span className={`${styles.pillPoints} ${shared.stroke}`}>
              <span className={styles.pillPointsRow}>
                <span className={`${styles.pillPointsText} ${shared.textNavy}`}>{`${points} PTS`}</span>
                {state === "signedIn" ? (
                  <span className={`${styles.pillPointsText} ${shared.textNavy}`}>{rank}</span>
                ) : null}
              </span>
            </span>
          </Link>

          <Link href={profileHref} className={`${styles.avatar} ${shared.stroke}`} aria-label="Profil">
            <UserIcon uid={`${uid}-user`} />
          </Link>
        </div>
      )}
    </header>
  )
}

/*
 * EXCRATCH tidak punya glyph "·" dan "×". Figma menggambarnya dengan font cadangan
 * yang bentuknya paling dekat dengan Gabarito, jadi dua simbol itu dipasang Gabarito
 * (kalau dibiarkan, browser memakai Orbitron dan bentuknya beda).
 */
function withSymbolFallback(text: string) {
  return text.split(/([·×])/).map((part, index) =>
    part === "·" || part === "×" ? (
      <span key={index} className={styles.symbol}>
        {part}
      </span>
    ) : (
      part
    ),
  )
}
