"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import PanelHifi from "@/features/admin-hifi/PanelHifi"
import styles from "@/features/booth-points/BoothAccessManager.module.css"
import { postWithAuth } from "@/features/dashboard/apiClient"

/* Insight Arcade proof review (/admin/arcade-review): verify keeps the points, void removes them. */

export type ReviewItem = {
  id: string
  name: string
  rank: number | null
  quest: string
  points: number
  pending: boolean
  handle: string | null
  vote: string | null
  imageUrl: string | null
  duplicate: boolean
  submittedAt: string
}

export default function ReviewQueue({ items }: { items: ReviewItem[] }) {
  const router = useRouter()
  const [refreshing, startRefresh] = useTransition()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function decide(id: string, decision: "verify" | "void") {
    setBusy(id)
    setError(null)
    const res = await postWithAuth<unknown>("/api/arcade/review", { submissionId: id, decision }).catch(() => null)
    setBusy(null)
    if (!res || res.needsAuth || !res.payload.success) {
      setError(res && !res.needsAuth && !res.payload.success ? res.payload.error.message : "Gagal menyimpan.")
    }
    startRefresh(() => router.refresh())
  }

  return (
    <PanelHifi title={`Bukti menunggu (${items.length})`} subtitle="Peringkat atas dulu. Verify = poin tetap, Void = poin dicabut.">
      {error ? <p className={`${styles.status} ${styles.statusError}`}>{error}</p> : null}
      {items.length === 0 ? <p className={styles.muted}>Tidak ada bukti yang menunggu.</p> : null}
      <ul className={styles.log}>
        {items.map((item) => (
          <li key={item.id} className={styles.logRow}>
            <span className={styles.logName}>
              {item.rank ? `#${item.rank} · ` : ""}
              {item.name}
            </span>
            <span className={styles.logTag}>
              {item.quest} · {item.pending ? "belum dapat poin" : `+${item.points}`}
            </span>
            <span className={styles.logMeta}>
              {item.handle ? `@${item.handle} · ` : ""}
              {item.vote ? `dukung ${item.vote} · ` : ""}
              {item.duplicate ? "⚠ gambar sama dipakai akun lain · " : ""}
              {new Date(item.submittedAt).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })}
            </span>
            {item.imageUrl ? (
              <a href={item.imageUrl} target="_blank" rel="noopener noreferrer" className={styles.logMeta}>
                {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
                <img src={item.imageUrl} alt={`Bukti ${item.quest}`} style={{ maxWidth: "100%", maxHeight: 320, borderRadius: 8 }} />
              </a>
            ) : null}
            <span className={styles.logMeta} style={{ display: "flex", gap: 8 }}>
              <button type="button" className={styles.primaryBtn} disabled={busy !== null || refreshing} onClick={() => decide(item.id, "verify")}>
                Verify
              </button>
              <button type="button" className={styles.removeBtn} style={{ width: "auto", padding: "0 16px" }} disabled={busy !== null || refreshing} onClick={() => decide(item.id, "void")}>
                Void
              </button>
            </span>
          </li>
        ))}
      </ul>
    </PanelHifi>
  )
}
