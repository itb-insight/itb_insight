"use client"

import { useState } from "react"

import { MOCK_QUESTS, MOCK_STATS, mockFlashQuests, mockLiveBoard, mockSubmissions } from "../mockData"
import FlashQuestSlots from "./FlashQuestSlots"
import KillSwitch, { type KillState } from "./KillSwitch"
import LeaderboardControl from "./LeaderboardControl"
import ManualGrantForm from "./ManualGrantForm"
import OpsStats from "./OpsStats"
import QuestTable from "./QuestTable"
import ReviewQueue from "./ReviewQueue"
import styles from "./QuestOps.module.css"

export default function QuestOpsDashboard() {
  const [init] = useState(() => {
    const now = Date.now()
    return { live: mockLiveBoard(now), flash: mockFlashQuests(now), subs: mockSubmissions(now) }
  })

  const [frozen, setFrozen] = useState(false)
  const [refreshedAt, setRefreshedAt] = useState(init.live.updatedAt)
  const [flash, setFlash] = useState(init.flash)
  const [kill, setKill] = useState<KillState>("off")
  const [quests, setQuests] = useState(MOCK_QUESTS)
  const [subs, setSubs] = useState(init.subs)

  const paused = kill === "on"

  const launch = (id: string) =>
    setFlash((list) =>
      list.map((s) => (s.id === id ? { ...s, endsAt: new Date(Date.now() + s.durationMin * 60_000).toISOString() } : s)),
    )
  const end = (id: string) => setFlash((list) => list.map((s) => (s.id === id ? { ...s, endsAt: null } : s)))

  const toggleQuest = (code: string) =>
    setQuests((list) => list.map((q) => (q.code === code ? { ...q, state: q.state === "live" ? "paused" : "live" } : q)))

  const decide = (id: string, decision: "approved" | "rejected") =>
    setSubs((list) => list.map((s) => (s.id === id ? { ...s, status: decision } : s)))

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>QUEST OPS</h1>
        <p className={styles.eyebrow}>
          ORGANIZER <span className={styles.dot} aria-hidden /> AUDITED
        </p>
      </header>

      {paused ? (
        <p className={`${styles.banner} ${styles.bannerDanger}`} role="alert">
          KILL SWITCH AKTIF: semua pemberian poin dan penukaran hadiah dijeda.
        </p>
      ) : (
        <p className={styles.banner}>Mode demo: data dummy, aksi belum tersimpan ke server.</p>
      )}

      <OpsStats stats={MOCK_STATS} />

      <div className={styles.row3}>
        <LeaderboardControl
          frozen={frozen}
          freezeAt={init.live.leaderboard.window.closesAt}
          refreshedAt={refreshedAt}
          onToggleFreeze={() => setFrozen((f) => !f)}
          onRefresh={() => setRefreshedAt(new Date().toISOString())}
        />
        <FlashQuestSlots slots={flash} disabled={paused} onLaunch={launch} onEnd={end} />
        <KillSwitch
          state={kill}
          onRequest={() => setKill("pending")}
          onConfirm={() => setKill("on")}
          onCancel={() => setKill("off")}
          onResume={() => setKill("off")}
        />
      </div>

      <QuestTable quests={quests} onToggleState={toggleQuest} />

      <div className={styles.row2}>
        <ReviewQueue submissions={subs} disabled={paused} onDecide={decide} />
        <ManualGrantForm quests={quests} disabled={paused} onGrant={() => {}} />
      </div>
    </div>
  )
}
