"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import PanelHifi from "@/features/admin-hifi/PanelHifi"
import styles from "@/features/booth-points/BoothAccessManager.module.css"
import { postWithAuth } from "@/features/dashboard/apiClient"

/* Insight Arcade results (/admin/arcade-results): check the top 15, then publish. */

export type Contender = { rank: number; userId: string; name: string; points: number; unreviewed: number }
export type Winner = { rank: number; name: string; points: number; prize: string; claimed: boolean }

export default function PublishResults({
  contenders,
  winners,
  version,
  frozen,
}: {
  contenders: Contender[]
  winners: Winner[]
  version: number | null
  frozen: boolean
}) {
  const router = useRouter()
  const [, startRefresh] = useTransition()
  const [disqualify, setDisqualify] = useState<string[]>([])
  const [force, setForce] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function publish() {
    if (!window.confirm("Umumkan hasil akhir sekarang? Mug (1–5) dan Keychain (6–10) diambil dari hasil ini.")) return
    setBusy(true)
    const res = await postWithAuth<{ version: number }>("/api/arcade/results", { force, disqualify }).catch(() => null)
    setBusy(false)
    if (!res || res.needsAuth) return setMessage({ ok: false, text: "Sesi berakhir atau sinyal terputus." })
    if (!res.payload.success) return setMessage({ ok: false, text: res.payload.error.message })
    setMessage({ ok: true, text: `Hasil versi ${res.payload.data.version} diumumkan.` })
    startRefresh(() => router.refresh())
  }

  return (
    <div className={styles.layout}>
      <div className={styles.column}>
        <PanelHifi title="Top 15 saat ini" subtitle="Semua bukti mereka harus sudah direview. Centang untuk mendiskualifikasi.">
          <ul className={styles.log}>
            {contenders.map((c) => (
              <li key={c.userId} className={styles.logRow}>
                <span className={styles.logName}>
                  #{c.rank} {c.name}
                </span>
                <span className={styles.logTag}>{c.points} poin</span>
                <span className={styles.logMeta}>
                  {c.unreviewed > 0 ? `⚠ ${c.unreviewed} bukti belum direview · ` : ""}
                  <label>
                    <input
                      type="checkbox"
                      checked={disqualify.includes(c.userId)}
                      onChange={(e) =>
                        setDisqualify((prev) => (e.target.checked ? [...prev, c.userId] : prev.filter((id) => id !== c.userId)))
                      }
                    />{" "}
                    diskualifikasi
                  </label>
                </span>
              </li>
            ))}
          </ul>
          <label className={styles.muted}>
            <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} /> Umumkan walau masih ada
            bukti belum direview
          </label>
          <button type="button" className={styles.primaryBtn} disabled={busy || !frozen} onClick={publish}>
            {frozen ? "Umumkan hasil akhir" : "Bisa diumumkan setelah 14:50"}
          </button>
          {message ? <p className={`${styles.status} ${message.ok ? styles.statusOk : styles.statusError}`}>{message.text}</p> : null}
        </PanelHifi>
      </div>
      <div className={styles.column}>
        <PanelHifi title={version ? `Pemenang (versi ${version})` : "Belum diumumkan"} subtitle="Diambil di meja hadiah Booth Entre.">
          <ul className={styles.log}>
            {winners.map((w) => (
              <li key={w.rank} className={styles.logRow}>
                <span className={styles.logName}>
                  #{w.rank} {w.name}
                </span>
                <span className={w.claimed ? styles.logAdded : styles.logTag}>
                  {w.prize} · {w.claimed ? "sudah diambil" : "belum diambil"}
                </span>
              </li>
            ))}
          </ul>
        </PanelHifi>
      </div>
    </div>
  )
}
