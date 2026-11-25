"use client"

import { formatMs } from "../format"
import type { FlashQuest } from "../types"
import { useNow } from "../useNow"
import styles from "./QuestOps.module.css"

interface FlashQuestSlotsProps {
  slots: FlashQuest[]
  disabled: boolean
  onLaunch: (id: string) => void
  onEnd: (id: string) => void
}

export default function FlashQuestSlots({ slots, disabled, onLaunch, onEnd }: FlashQuestSlotsProps) {
  const now = useNow()
  const isLive = (s: FlashQuest) => s.endsAt !== null && new Date(s.endsAt).getTime() > now
  const anyLive = slots.some(isLive)

  return (
    <section className={styles.panel} aria-labelledby="flash-title">
      <h2 id="flash-title" className={styles.panelTitle}>
        Flash quest slots
      </h2>
      <ul className={styles.slotList}>
        {slots.map((s) => (
          <li key={s.id} className={styles.slot}>
            <span>{s.label}</span>
            {isLive(s) ? (
              <>
                <span className={styles.slotMeta} suppressHydrationWarning>
                  LIVE <span className={styles.dot} aria-hidden /> {formatMs(new Date(s.endsAt!).getTime() - now)} left
                </span>
                <button type="button" className={`${styles.btn} ${styles.btnSmall}`} onClick={() => onEnd(s.id)}>
                  End
                </button>
              </>
            ) : (
              <>
                <span className={styles.slotMeta}>{s.durationMin} min</span>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSmall} ${styles.btnPrimary}`}
                  disabled={disabled || anyLive}
                  title={anyLive ? "Akhiri flash quest yang sedang LIVE dulu" : undefined}
                  onClick={() => onLaunch(s.id)}
                >
                  Launch
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
