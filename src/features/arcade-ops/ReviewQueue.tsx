"use client"

import clsx from "clsx"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import PanelHifi from "@/features/admin-hifi/PanelHifi"
import { postWithAuth } from "@/features/dashboard/apiClient"

import styles from "./ReviewQueue.module.css"

/*
  Insight Arcade proof review (/admin/arcade-review): verify keeps the points (or grants them for a
  re-submission), void removes them. Proofs are a link (social quests) or a photo. Void asks for a second click. A decided card leaves the list at once;
  the page then refreshes from the server.
*/

export type ReviewItem = {
  id: string
  name: string
  rank: number | null
  quest: string
  points: number
  pending: boolean
  handle: string | null
  /** sidequests.needs_handle: 'instagram' | 'tiktok_x' | null. */
  platform: string | null
  vote: string | null
  imageUrl: string | null
  /** Link proof (social quests): the profile / story / post, validated https on IG, TikTok or X. */
  linkUrl: string | null
  duplicate: boolean
  submittedAt: string
}

// Where a follow-quest username can be checked. The TikTok/X quest does not say which of the two
// the player used, so both are offered.
function profileLinks(platform: string | null, handle: string): Array<{ label: string; href: string }> {
  // Handles are checked server-side against ^[a-z0-9._]{1,40}$ (arcade_submit_proof).
  if (!/^[a-z0-9._]{1,40}$/.test(handle)) return []
  if (platform === "instagram") return [{ label: "Instagram", href: `https://www.instagram.com/${handle}/` }]
  if (platform === "tiktok_x") {
    return [
      { label: "TikTok", href: `https://www.tiktok.com/@${handle}` },
      { label: "X", href: `https://x.com/${handle}` },
    ]
  }
  return []
}

const timeFormat = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" })

export default function ReviewQueue({ items, more }: { items: ReviewItem[]; more?: boolean }) {
  const router = useRouter()
  const [refreshing, startRefresh] = useTransition()
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmVoid, setConfirmVoid] = useState<string | null>(null)
  const [decided, setDecided] = useState<Set<string>>(() => new Set())
  const [error, setError] = useState<string | null>(null)

  async function decide(id: string, decision: "verify" | "void") {
    setBusy(id)
    setError(null)
    setConfirmVoid(null)
    const res = await postWithAuth<unknown>("/api/arcade/review", { submissionId: id, decision }).catch(() => null)
    setBusy(null)
    if (!res || res.needsAuth || !res.payload.success) {
      setError(res && !res.needsAuth && !res.payload.success ? res.payload.error.message : "Gagal menyimpan. Coba lagi.")
    } else {
      setDecided((prev) => new Set(prev).add(id))
    }
    startRefresh(() => router.refresh())
  }

  const visible = items.filter((item) => !decided.has(item.id))

  return (
    <PanelHifi
      title={`Bukti menunggu (${visible.length}${more ? "+" : ""})`}
      subtitle="Peringkat atas dulu. Verify = poin tetap, Void = poin dicabut. Ketuk gambar atau link untuk memeriksa."
    >
      <div className={styles.wrap}>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        {visible.length === 0 ? <p className={styles.muted}>Tidak ada bukti yang menunggu.</p> : null}
        <ul className={styles.grid}>
          {visible.map((item) => {
            const disabled = busy !== null || refreshing
            const profiles = item.handle ? profileLinks(item.platform, item.handle) : []
            return (
              <li key={item.id} className={clsx(styles.card, item.duplicate && styles.cardDuplicate)}>
                {item.linkUrl ? (
                  <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className={styles.linkProof}>
                    <span className={styles.linkProofLabel}>Bukti link · buka untuk memeriksa ↗</span>
                    <span className={styles.linkProofUrl}>{item.linkUrl.replace(/^https:\/\//, "")}</span>
                    <span className={styles.linkProofHint}>Tidak bisa dibuka atau akun privat? Void.</span>
                  </a>
                ) : item.imageUrl ? (
                  <a href={item.imageUrl} target="_blank" rel="noopener noreferrer" className={styles.imageLink}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
                    <img src={item.imageUrl} alt={`Bukti ${item.quest} dari ${item.name}`} className={styles.image} loading="lazy" />
                  </a>
                ) : (
                  <div className={styles.imageLink}>
                    <span className={styles.noImage}>Bukti tidak tersedia</span>
                  </div>
                )}
                <div className={styles.details}>
                  <div className={styles.row}>
                    <p className={styles.name}>{item.name}</p>
                    {item.rank ? <span className={styles.rank}>#{item.rank}</span> : null}
                  </div>
                  <p className={styles.quest}>{item.quest}</p>
                  <div className={styles.chips}>
                    {item.pending ? (
                      <span className={clsx(styles.chip, styles.chipPending)}>Kirim ulang · belum dapat poin</span>
                    ) : (
                      <span className={clsx(styles.chip, styles.chipPoints)}>+{item.points} poin sudah masuk</span>
                    )}
                    {item.handle ? (
                      <span className={styles.chip}>
                        @{item.handle}
                        {profiles.map((p) => (
                          <span key={p.label}>
                            {" · "}
                            <a href={p.href} target="_blank" rel="noopener noreferrer">
                              {p.label}
                            </a>
                          </span>
                        ))}
                      </span>
                    ) : null}
                    {item.vote ? <span className={styles.chip}>Dukung {item.vote}</span> : null}
                  </div>
                  {item.duplicate ? (
                    <p className={styles.warning}>⚠ {item.linkUrl ? "Link" : "Gambar"} yang sama juga dikirim akun lain.</p>
                  ) : null}
                  <p className={styles.time}>Dikirim {timeFormat.format(new Date(item.submittedAt))} WIB</p>
                  <div className={styles.actions}>
                    <button type="button" className={styles.verify} disabled={disabled} onClick={() => decide(item.id, "verify")}>
                      {busy === item.id ? "Menyimpan…" : "Verify"}
                    </button>
                    <button
                      type="button"
                      className={clsx(styles.void, confirmVoid === item.id && styles.voidConfirm)}
                      disabled={disabled}
                      onClick={() => (confirmVoid === item.id ? decide(item.id, "void") : setConfirmVoid(item.id))}
                    >
                      {confirmVoid === item.id ? "Yakin void?" : "Void"}
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </PanelHifi>
  )
}
