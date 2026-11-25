"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useId, useRef, useState, type MouseEvent } from "react"

import { CancelIcon, CheckIcon, PinIcon } from "./QuestIcons"
import shared from "./quest-shared.module.css"
import styles from "./QuestHowToPlayHifi.module.css"

/*
 * Figma: halaman "Quest" > Section 2 > frame "How to play" (2105:5863)
 * dan ikon "cancel" (2105:6188) di pojok kiri atasnya.
 */

export interface QuestRule {
  /** Bagian tebal di awal kalimat, termasuk spasi penutupnya. */
  lead: string
  body: string
}

interface QuestHowToPlayHifiProps {
  rules?: QuestRule[]
  /** Tujuan tombol X kalau tidak ada halaman sebelumnya untuk kembali. */
  closeHref?: string
  privacyHref?: string
  rulesHref?: string
  /** Tujuan tombol ENTER QUEST MODE. Baru bisa dibuka setelah kotak aturan dicentang. */
  enterHref?: string
}

/* Teks dari Figma, typo-nya sudah dibetulkan ("set your rank", "Leaderboard"). */
const DEFAULT_RULES: QuestRule[] = [
  {
    lead: "Do Quest ",
    body: "at sponsors booth, landmarks, and events. Scan the code booth staff give you after a chat or demo.",
  },
  {
    lead: "Two Balances. ",
    body: "Wallet points are spent on rewards. Lifetime points set your rank, and spending never lowers it.",
  },
  {
    lead: "Leaderboard freezes at [FREEZE TIME]. ",
    body: "Only quests synced before then count towards the doorprize.",
  },
]

export default function QuestHowToPlayHifi({
  rules = DEFAULT_RULES,
  closeHref = "/quest",
  privacyHref = "/privacy",
  rulesHref = "/terms",
  enterHref = "/quest",
}: QuestHowToPlayHifiProps) {
  const uid = useId().replace(/:/g, "")
  const router = useRouter()
  const checkboxRef = useRef<HTMLInputElement>(null)
  const [accepted, setAccepted] = useState(false)

  const onEnter = (event: MouseEvent<HTMLAnchorElement>) => {
    if (accepted) return
    event.preventDefault()
    checkboxRef.current?.focus()
  }

  // Tombol X berfungsi sebagai tombol kembali.
  const onClose = () => {
    if (window.history.length > 1) router.back()
    else router.push(closeHref)
  }

  return (
    <section className={`${styles.page} ${shared.frameBg}`} aria-labelledby={`${uid}-title`}>
      <button type="button" onClick={onClose} className={styles.close} aria-label="Kembali">
        <CancelIcon uid={`${uid}-cancel`} />
      </button>

      <p className={`${styles.eyebrow} ${shared.textIce}`}>Quest Mode</p>
      <h1 id={`${uid}-title`} className={styles.title}>
        Explore Ganesha.
        <br />
        Earn Points.
        <br />
        Claim Rewards.
      </h1>

      <ol className={styles.rules}>
        {rules.map((rule, index) => (
          <li key={rule.lead} className={`${styles.rule} ${shared.stroke}`}>
            <span className={`${styles.ruleNumber} ${shared.textIce}`} aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className={styles.ruleText}>
              <strong className={styles.ruleLead}>{rule.lead}</strong>
              {rule.body}
            </p>
          </li>
        ))}
      </ol>

      <div className={styles.privacy}>
        <PinIcon uid={`${uid}-pin`} className={styles.privacyIcon} />
        <p className={styles.privacyText}>
          We read your location
          <strong className={styles.privacyStrong}> only when you submit a quest,</strong>
          <span className={styles.privacyWideSpace}> </span>
          never in the background. Sponsors get your contact only if you opt in at their booth.{" "}
          <Link href={privacyHref} className={styles.privacyLink}>
            Privacy notice
          </Link>
        </p>
      </div>

      <label className={styles.accept}>
        <input
          ref={checkboxRef}
          type="checkbox"
          className={styles.acceptInput}
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
        />
        <span className={styles.acceptBox} aria-hidden="true">
          {accepted ? <CheckIcon uid={`${uid}-check`} /> : null}
        </span>
        <span className={styles.acceptText}>
          I’ve read the{" "}
          <Link href={rulesHref} className={styles.acceptLink}>
            rules
          </Link>
          . Exploits can void points.
        </span>
      </label>

      <Link
        href={enterHref}
        className={`${styles.enter} ${shared.stroke}`}
        aria-disabled={!accepted}
        onClick={onEnter}
      >
        <span className={`${styles.enterText} ${shared.excratch} ${shared.textNavy}`}>ENTER QUEST MODE</span>
      </Link>
    </section>
  )
}

