/*
 * Kerangka layar Quest Mode. Navigasi bawahnya DIBUANG dari sini: ada dua
 * implementasi dengan nama sama di folder ini, dan yang dipakai adalah
 * ./QuestBottomNav (punya Nagita) karena di versi ini tab Map, Board dan
 * Rewards cuma <button> mati, bukan Link.
 */
import clsx from "clsx"
import Link from "next/link"
import type { ReactNode } from "react"

import { BackIcon, HomeIcon } from "./icons"
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

interface QuestScreenProps {
  children: ReactNode
}

export function QuestScreen({ children }: QuestScreenProps) {
  return <div className={styles.screen}>{children}</div>
}
