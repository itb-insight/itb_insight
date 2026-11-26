"use client"

import clsx from "clsx"
import { useState } from "react"

import FlashBanner from "./FlashBanner"
import PointsCard from "./PointsCard"
import QuestCard from "./QuestCard"
import { QuestHeader, QuestScreen } from "./QuestShell"
import SideQuestSection from "./SideQuestSection"
import styles from "./quest.module.css"
import type { EasterEgg, QuestCollection, QuestItem, QuestStats } from "./types"

type QuestTab = "main" | "side"

interface QuestHubProps {
  stats: QuestStats
  flash: { title: string; description: string; secondsLeft: number }
  mainQuests: QuestItem[]
  collections: QuestCollection[]
  eggs: EasterEgg[]
  basePath: string
  mainCount?: string
  sideCount?: string
  initialTab?: QuestTab
}

export default function QuestHub({
  stats,
  flash,
  mainQuests,
  collections,
  eggs,
  basePath,
  mainCount,
  sideCount = "2/??",
  initialTab = "main",
}: QuestHubProps) {
  const [tab, setTab] = useState<QuestTab>(initialTab)
  const doneCount = mainQuests.filter((quest) => quest.status === "done").length
  const mainLabel = `Main Quest ${mainCount ?? `${doneCount}/${mainQuests.length}`}`
  const sideLabel = `Side Quest ${sideCount}`

  return (
    <QuestScreen>
      <div className={styles.body}>
        <QuestHeader compact={tab === "side"} showHome={tab === "main"} />
        <PointsCard stats={stats} compact={tab === "side"} />
        <FlashBanner title={flash.title} description={flash.description} secondsLeft={flash.secondsLeft} />
        <div className={styles.tabs} role="tablist" aria-label="Quest type">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "main"}
            className={clsx(styles.tab, tab === "main" ? styles.tabActive : styles.tabIdle)}
            onClick={() => setTab("main")}
          >
            {mainLabel}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "side"}
            className={clsx(styles.tab, tab === "side" ? styles.tabActive : styles.tabIdle)}
            onClick={() => setTab("side")}
          >
            {sideLabel}
          </button>
        </div>
        {tab === "main" ? (
          <div className={styles.list} role="tabpanel">
            {mainQuests.map((quest) => (
              <QuestCard key={quest.id} quest={quest} href={`${basePath}/${quest.id}`} />
            ))}
          </div>
        ) : (
          <div role="tabpanel">
            <SideQuestSection collections={collections} eggs={eggs} />
          </div>
        )}
      </div>
    </QuestScreen>
  )
}
