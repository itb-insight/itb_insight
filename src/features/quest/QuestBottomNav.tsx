import Link from "next/link"

import { BoardTabIcon, MapTabIcon, QuestsTabIcon, RewardsTabIcon, ScanIcon } from "./QuestIcons"
import shared from "./quest-shared.module.css"
import styles from "./QuestBottomNav.module.css"

/*
 * Figma: "Group 48096290" di frame "Quest Map Layer" (2185:798) —
 * komponen "Navbar Bottom + Home Indicator" (620:1381) dan tombol scan di tengahnya.
 *
 * Asalnya QuestBottomNavHifi dari branch feat/quest-section2 (Nagita). Dipakai
 * menggantikan versiku karena href-nya sudah benar. Yang kuubah cuma namanya
 * (akhiran -Hifi dibuang: section quest tidak punya versi lo-fi) dan dua hal di
 * CSS yang ditandai di sana.
 */

export type QuestTab = "quests" | "map" | "board" | "rewards"

interface QuestBottomNavProps {
  /** Tab halaman yang sedang dibuka; warnanya terang (#dee8fb). */
  active?: QuestTab
  hrefs?: Partial<Record<QuestTab | "scan", string>>
}

const DEFAULT_HREFS: Record<QuestTab | "scan", string> = {
  quests: "/arcade",
  map: "/event-map",
  scan: "/arcade/qr",
  board: "/arcade/leaderboard",
  rewards: "/arcade/rewards",
}

const TABS = [
  { key: "quests", label: "Quests", Icon: QuestsTabIcon },
  { key: "map", label: "Map", Icon: MapTabIcon },
  { key: "board", label: "Board", Icon: BoardTabIcon },
  { key: "rewards", label: "Rewards", Icon: RewardsTabIcon },
] as const

export default function QuestBottomNav({ active = "quests", hrefs = {} }: QuestBottomNavProps) {
  const [left, right] = [TABS.slice(0, 2), TABS.slice(2)]

  const renderTab = ({ key, label, Icon }: (typeof TABS)[number]) => (
    <li key={key}>
      <Link
        href={hrefs[key] ?? DEFAULT_HREFS[key]}
        className={`${styles.tab} ${key === active ? styles.tabActive : ""}`}
        aria-current={key === active ? "page" : undefined}
      >
        <Icon className={styles.tabIcon} />
        <span className={styles.tabLabel}>{label}</span>
      </Link>
    </li>
  )

  return (
    <nav className={`${styles.bar} ${shared.frameBg}`} aria-label="Quest">
      <ul className={styles.tabs}>
        {left.map(renderTab)}
        {/* Slot tengah: di Figma ada item "Scan" di bawah tombol, tertutup tombolnya. */}
        <li className={styles.scanSlot}>
          <Link href={hrefs.scan ?? DEFAULT_HREFS.scan} className={`${styles.scan} ${shared.stroke}`} aria-label="Scan">
            <ScanIcon />
          </Link>
        </li>
        {right.map(renderTab)}
      </ul>
      <span className={styles.homeIndicator} aria-hidden="true" />
    </nav>
  )
}
