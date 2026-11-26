import clsx from "clsx"
import Link from "next/link"
import type { ReactNode } from "react"

import { BackIcon, BoardNavIcon, HomeIcon, MapNavIcon, QuestsNavIcon, RewardsNavIcon, ScanIcon } from "./icons"
import styles from "./quest.module.css"

interface QuestHeaderProps {
  compact?: boolean
  showHome?: boolean
}

export function QuestHeader({ compact, showHome }: QuestHeaderProps) {
  return (
    <header className={clsx(styles.header, compact && styles.headerCompact)}>
      {showHome ? (
        <Link href="/" className={styles.headerAction} aria-label="Home">
          <HomeIcon />
        </Link>
      ) : null}
      <h1 className={styles.headerTitle}>Quest Mode</h1>
    </header>
  )
}

interface BackButtonProps {
  href: string
}

export function BackButton({ href }: BackButtonProps) {
  return (
    <div className={styles.detailBack}>
      <Link href={href} className={styles.headerAction} aria-label="Back to quests">
        <BackIcon />
      </Link>
    </div>
  )
}

interface QuestBottomNavProps {
  active?: "quests" | "map" | "board" | "rewards"
  questsHref: string
}

export function QuestBottomNav({ active = "quests", questsHref }: QuestBottomNavProps) {
  const itemClass = (key: string) => clsx(styles.navItem, active === key && styles.navItemActive)
  return (
    <nav className={styles.nav} aria-label="Quest navigation">
      <ul className={styles.navList}>
        <li>
          <Link href={questsHref} className={itemClass("quests")} aria-current={active === "quests" ? "page" : undefined}>
            <span className={styles.navIcon}>
              <QuestsNavIcon />
            </span>
            Quests
          </Link>
        </li>
        <li>
          <button type="button" className={itemClass("map")}>
            <span className={styles.navIcon}>
              <MapNavIcon />
            </span>
            Map
          </button>
        </li>
        <li>
          <button type="button" className={styles.scanButton} aria-label="Scan">
            <ScanIcon />
          </button>
        </li>
        <li>
          <button type="button" className={itemClass("board")}>
            <span className={styles.navIcon}>
              <BoardNavIcon />
            </span>
            Board
          </button>
        </li>
        <li>
          <button type="button" className={itemClass("rewards")}>
            <span className={styles.navIcon}>
              <RewardsNavIcon />
            </span>
            Rewards
          </button>
        </li>
      </ul>
      <span className={styles.homeIndicator} aria-hidden="true" />
    </nav>
  )
}

interface QuestScreenProps {
  children: ReactNode
}

export function QuestScreen({ children }: QuestScreenProps) {
  return <div className={styles.screen}>{children}</div>
}
