"use client"

import { useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"

import Countdown from "../Countdown"
import { clockWib, formatCount, publicName } from "../format"
import { LIVE_REFRESH_MS, loadLiveBoard } from "../source"
import type { FlashQuest, LiveBoardData } from "../types"
import { useNow } from "../useNow"
import { useFitScale } from "./useFitScale"
import styles from "./QuestLiveBoard.module.css"

const CANVAS_W = 947
const CANVAS_H = 605
const QUEST_URL = "https://itbinsight.com/quest"

interface QuestLiveBoardProps {
  initial: LiveBoardData
}

export default function QuestLiveBoard({ initial }: QuestLiveBoardProps) {
  const [data, setData] = useState(initial)
  const stageRef = useFitScale<HTMLDivElement>(CANVAS_W, CANVAS_H)

  useEffect(() => {
    const id = window.setInterval(() => {
      loadLiveBoard().then(setData).catch(() => {})
    }, LIVE_REFRESH_MS)
    return () => window.clearInterval(id)
  }, [])

  const { window: questWindow, entries } = data.leaderboard

  return (
    <main ref={stageRef} className={styles.stage}>
      <div className={styles.canvas}>
        <section className={styles.board} aria-labelledby="live-title">
          <p className={styles.eyebrow}>
            ITB INSIGHT <span className={styles.dot} aria-hidden /> QUEST MODE
          </p>
          <h1 id="live-title" className={styles.title}>
            Leaderboard
          </h1>

          <p className={styles.meta}>
            Update {clockWib(data.updatedAt)} <span className={styles.dot} aria-hidden /> every 5 min
          </p>

          <ol className={styles.list}>
            {entries.slice(0, 10).map((e) => (
              <li key={e.userId} className={`${styles.row} ${e.rank === 1 ? styles.first : ""}`}>
                <span className={styles.rank}>{e.rank}</span>
                <span className={styles.name}>{publicName(e.fullName)}</span>
                <span className={styles.tag}>{e.institution ?? "Visitor"}</span>
                <span className={styles.points}>{formatCount(e.totalPoints)}</span>
              </li>
            ))}
          </ol>
        </section>

        <aside className={styles.side}>
          <FlashCard quest={data.flashQuest} />

          <section className={styles.freezeCard}>
            {questWindow.isFrozen || !questWindow.closesAt ? (
              <>
                <p className={styles.caption}>LEADERBOARD FROZEN</p>
                <p className={styles.bigClock}>FINAL</p>
                <p className={styles.freezeNote}>Doorprize top {data.doorprizeTopN} sudah ditentukan</p>
              </>
            ) : (
              <>
                <p className={styles.caption}>LEADERBOARD FREEZES IN</p>
                <Countdown until={questWindow.closesAt} className={styles.bigClock} />
                <p className={styles.freezeNote}>Doorprize top {data.doorprizeTopN} at freeze</p>
              </>
            )}
          </section>

          <section className={styles.joinCard}>
            <div className={styles.qr}>
              <QRCodeSVG value={QUEST_URL} size={128} marginSize={1} level="M" role="img" aria-label="QR ke itbinsight.com/quest" />
            </div>
            <div>
              <p className={styles.joinTitle}>Not playing yet?</p>
              <p className={styles.joinUrl}>itbinsight.com/quest</p>
              <p className={styles.joinStats}>
                {formatCount(data.players)} players <span className={styles.dot} aria-hidden /> {formatCount(data.questsDone)} quests done
              </p>
            </div>
          </section>
        </aside>
      </div>
    </main>
  )
}

function FlashCard({ quest }: { quest: FlashQuest | null }) {
  const now = useNow(1000)
  const live = quest?.endsAt && new Date(quest.endsAt).getTime() > now

  if (!quest || !live) {
    return (
      <section className={`${styles.flashCard} ${styles.flashIdle}`}>
        <p className={styles.caption}>FLASH QUEST</p>
        <p className={styles.flashTitle}>Nantikan flash quest berikutnya</p>
        <p className={styles.caption}>Pantau layar ini untuk poin ganda</p>
      </section>
    )
  }

  return (
    <section className={styles.flashCard}>
      <p className={styles.caption}>FLASH QUEST LIVE</p>
      <p className={styles.flashTitle}>{quest.label}</p>
      <Countdown until={quest.endsAt!} format="ms" className={styles.flashClock} />
      <p className={styles.caption}>{quest.location}</p>
    </section>
  )
}
