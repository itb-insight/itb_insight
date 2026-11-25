"use client"

import { useState } from "react"

import type { QuestRow } from "../types"
import styles from "./QuestOps.module.css"

export const GRANT_CAP = 1000

export type GrantInput = { userRef: string; points: number; questCode: string; reason: string }

interface ManualGrantFormProps {
  quests: QuestRow[]
  disabled: boolean
  onGrant: (input: GrantInput) => void
}

export function validateGrant(raw: { userRef: string; points: string; reason: string }): string | null {
  if (!raw.userRef.trim()) return "User ref wajib diisi."
  const n = Number(raw.points)
  if (!Number.isInteger(n) || n === 0) return "Poin harus bilangan bulat dan tidak boleh 0."
  if (Math.abs(n) > GRANT_CAP) return `Poin maksimal ${GRANT_CAP} (atau -${GRANT_CAP} untuk koreksi).`
  if (raw.reason.trim().length < 10) return "Reason wajib diisi (minimal 10 karakter)."
  return null
}

export default function ManualGrantForm({ quests, disabled, onGrant }: ManualGrantFormProps) {
  const [userRef, setUserRef] = useState("")
  const [points, setPoints] = useState("")
  const [questCode, setQuestCode] = useState(quests[0]?.code ?? "")
  const [reason, setReason] = useState("")
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const error = validateGrant({ userRef, points, reason })
    if (error) {
      setMsg({ ok: false, text: error })
      return
    }
    const n = Number(points)
    onGrant({ userRef: userRef.trim(), points: n, questCode, reason: reason.trim() })
    setMsg({ ok: true, text: `${n > 0 ? "+" : ""}${n} poin untuk ${userRef.trim()} tercatat (demo).` })
    setUserRef("")
    setPoints("")
    setReason("")
  }

  return (
    <section className={styles.panel} aria-labelledby="grant-title">
      <h2 id="grant-title" className={`${styles.panelTitle} ${styles.panelTitleSmall}`}>
        Help desk <span className={styles.dot} aria-hidden /> manual grant
      </h2>

      <form className={styles.form} onSubmit={submit} noValidate>
        <label className={styles.field}>
          User ref
          <input className={styles.input} value={userRef} onChange={(e) => setUserRef(e.target.value)} placeholder="U-0812-37" />
        </label>
        <label className={styles.field}>
          Point (max {GRANT_CAP})
          <input
            className={styles.input}
            type="number"
            inputMode="numeric"
            min={-GRANT_CAP}
            max={GRANT_CAP}
            step={1}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            placeholder="80"
          />
        </label>
        <label className={styles.field}>
          Quest
          <select className={styles.select} value={questCode} onChange={(e) => setQuestCode(e.target.value)}>
            {quests.map((q) => (
              <option key={q.code} value={q.code}>
                {q.code} {q.name}
              </option>
            ))}
            <option value="">Tanpa quest (koreksi poin)</option>
          </select>
        </label>
        <label className={`${styles.field} ${styles.fieldWide}`}>
          <span>
            Reason <span className={styles.req}>*</span>
          </span>
          <input
            className={styles.input}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g QR on site was damaged, staff verified in person"
            maxLength={300}
          />
        </label>

        <div className={styles.formFoot}>
          <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={disabled}>
            Grant points
          </button>
          {msg && (
            <p className={`${styles.formMsg} ${msg.ok ? styles.formOk : styles.formError}`} role={msg.ok ? "status" : "alert"}>
              {msg.text}
            </p>
          )}
          {disabled && <p className={`${styles.formMsg} ${styles.formError}`}>Kill switch aktif, grant dijeda.</p>}
        </div>
      </form>
    </section>
  )
}
