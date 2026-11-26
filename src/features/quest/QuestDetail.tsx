"use client"

import clsx from "clsx"
import { useState } from "react"
import type { FormEvent } from "react"

import { PinIcon, ClockSmallIcon, ScanBarcodeIcon, WifiLowIcon } from "./icons"
import { BackButton, QuestScreen } from "./QuestShell"
import styles from "./quest.module.css"
import type { QuestDetailData } from "./types"

interface QuestDetailProps {
  quest: QuestDetailData
  backHref: string
  onScan?: () => void
  onSubmitCode?: (code: string, shareProfile: boolean) => void
}

export default function QuestDetail({ quest, backHref, onScan, onSubmitCode }: QuestDetailProps) {
  const [code, setCode] = useState("")
  const [share, setShare] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return
    onSubmitCode?.(trimmed, share)
  }

  return (
    <QuestScreen>
      <div className={styles.detailBody}>
        <BackButton href={backHref} />
        <p className={styles.detailPoints}>
          <span className={styles.detailPointsValue}>+{quest.points}</span>
          <span className={styles.detailPointsUnit}>points</span>
        </p>
        <h1 className={styles.detailTitle}>{quest.title}</h1>

        <section className={styles.info} aria-label="Quest info">
          <div className={styles.infoRow}>
            <span className={styles.infoItem}>
              <PinIcon />
              {quest.location}
            </span>
            <span className={styles.infoItem}>
              <ClockSmallIcon />
              {quest.hours}
            </span>
          </div>
          <ul className={styles.rules}>
            {quest.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </section>

        <h2 className={styles.stepsLabel}>How To Complete</h2>
        <ol className={styles.steps}>
          {quest.steps.map((step, index) => (
            <li key={step}>
              {index + 1}. {step}
            </li>
          ))}
        </ol>
        <p className={styles.bonus}>
          {quest.bonusNote}
          <strong>{quest.bonusHighlight}</strong>
          {quest.bonusSuffix}
        </p>

        <label className={styles.consent}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={share}
            onChange={(event) => setShare(event.target.checked)}
          />
          <span>
            <p className={styles.consentTitle}>
              Share my name and email with {quest.sponsor} <span>(optional)</span>
            </p>
            <p className={styles.consentText}>
              You get the points either way. You can withdraw this later from your profile.
            </p>
          </span>
        </label>

        <div className={styles.actions}>
          <button type="button" className={clsx(styles.lightButton, styles.scanWide)} onClick={onScan}>
            <ScanBarcodeIcon />
            Scan Staff Code
          </button>
          <p className={styles.orText}>or enter the code</p>
          <form className={styles.codeRow} onSubmit={handleSubmit}>
            <input
              className={styles.input}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="e.g. 7KQ-2MX"
              aria-label="Quest code"
              autoComplete="off"
            />
            <button type="submit" className={clsx(styles.lightButton, styles.submit)} disabled={!code.trim()}>
              Submit
            </button>
          </form>
          <p className={styles.signal}>
            <WifiLowIcon />
            <span>Weak signal? Your scan is saved on this phone and syncs on its own. It shows as Pending until then.</span>
          </p>
        </div>
      </div>
    </QuestScreen>
  )
}
