"use client"

import { useEffect, useRef, useState } from "react"

import { postWithAuth } from "@/features/dashboard/apiClient"
import QrCameraScanner from "@/shared/components/QrCameraScanner/QrCameraScanner"

import styles from "./BoothScanner.module.css"
import { warningScreens, type ScanAward, type ScanPreview } from "./types"

type BoothOption = { id: string; name: string; points: number; max_bonus_points: number; assigned: boolean }

type Phase =
  | { kind: "idle" }
  | { kind: "scanning" }
  | { kind: "loading"; label: string }
  | { kind: "review"; qrCode: string; preview: ScanPreview }
  | { kind: "done"; award: ScanAward }
  | { kind: "error"; title: string; message: string }

const ERROR_TITLES: Record<string, string> = {
  COMMITTEE_ACCOUNT: "Ini Akun Panitia!",
  SELF_AWARD: "Itu QR kamu sendiri",
  INVALID_QR: "QR tidak dikenali",
  TICKET_NOT_FOUND: "Pengunjung tidak ditemukan",
}

class ScanError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

/**
 * Staff booth scanner: pick the booth, scan the visitor's personal QR, review (who, how many
 * points, wireframe warnings, gate status), then give the points. On a repeat visit only a bonus
 * can be given. The server re-checks everything; this screen only explains it.
 */
export default function BoothScanner({ booths, canPickAnyBooth }: { booths: BoothOption[]; canPickAnyBooth: boolean }) {
  const [boothId, setBoothId] = useState(booths[0]?.id ?? "")
  const [bonus, setBonus] = useState("0")
  const [refreshing, setRefreshing] = useState(false)
  const [phase, setPhase] = useState<Phase>({ kind: "idle" })
  const requestSeq = useRef(0)
  const refreshTimer = useRef<number | undefined>(undefined)

  const booth = booths.find((b) => b.id === boothId) ?? null
  const bonusNumber = Number(bonus)

  async function call<T>(body: Record<string, unknown>): Promise<T> {
    const res = await postWithAuth<T>("/api/booths/scan", { boothId, ...body })
    if (res.needsAuth) throw new ScanError("AUTH", "Sesi berakhir. Silakan login ulang.")
    if (!res.payload.success) throw new ScanError(res.payload.error.code, res.payload.error.message)
    return res.payload.data
  }

  const fail = (err: unknown, fallback: string) => {
    const code = err instanceof ScanError ? err.code : ""
    const message = err instanceof Error ? err.message : fallback
    setPhase({ kind: "error", title: ERROR_TITLES[code] ?? "Gagal", message })
  }

  // Drops any pending re-preview so it cannot reopen or overwrite the screen.
  function stopRefresh() {
    window.clearTimeout(refreshTimer.current)
    requestSeq.current++
    setRefreshing(false)
  }

  async function handleScanned(qrCode: string) {
    stopRefresh()
    setBonus("0")
    setPhase({ kind: "loading", label: "Mencari pengunjung…" })
    try {
      const preview = await call<ScanPreview>({ qrCode, dryRun: true, bonusPoints: 0 })
      setPhase({ kind: "review", qrCode, preview })
    } catch (err) {
      fail(err, "Gagal membaca QR.")
    }
  }

  // Re-preview when the bonus changes (debounced), so totals and warnings always match what will be
  // sent. A sequence number drops answers that arrive after a newer edit.
  function handleBonusChange(qrCode: string, value: string) {
    setBonus(value)
    window.clearTimeout(refreshTimer.current)
    const next = Number(value)
    if (value.trim() === "" || !Number.isInteger(next) || next < 0) {
      setRefreshing(false)
      return
    }
    const seq = ++requestSeq.current
    setRefreshing(true)
    refreshTimer.current = window.setTimeout(async () => {
      try {
        const preview = await call<ScanPreview>({ qrCode, dryRun: true, bonusPoints: next })
        if (seq === requestSeq.current) setPhase({ kind: "review", qrCode, preview })
      } catch (err) {
        // Out-of-range bonus: keep the screen, the field shows the limit.
        if (!(err instanceof ScanError && err.code === "INVALID_BONUS") && seq === requestSeq.current) fail(err, "Gagal memuat ulang.")
      } finally {
        if (seq === requestSeq.current) setRefreshing(false)
      }
    }, 300)
  }

  useEffect(() => () => window.clearTimeout(refreshTimer.current), [])

  async function handleConfirm(qrCode: string) {
    stopRefresh()
    setPhase({ kind: "loading", label: "Memberi poin…" })
    try {
      // The review screen showed the warnings and the gate status, so confirming acknowledges both.
      const award = await call<ScanAward>({
        qrCode,
        bonusPoints: bonusNumber,
        confirmWarnings: true,
        confirmSkippedGate: true,
      })
      setPhase({ kind: "done", award })
    } catch (err) {
      fail(err, "Gagal memberi poin.")
    }
  }

  if (booths.length === 0) {
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>Scan Poin Booth</h1>
        <section className={styles.panel}>
          <p className={styles.note}>
            {canPickAnyBooth
              ? "Belum ada booth aktif."
              : "Akun kamu belum ditugaskan ke booth mana pun. Hubungi admin untuk didaftarkan sebagai staf booth."}
          </p>
        </section>
      </main>
    )
  }

  const review = phase.kind === "review" ? phase.preview : null
  const maxBonus = review
    ? review.mode === "bonus"
      ? (review.bonusRemaining ?? 0) + review.bonusPoints
      : (booth?.max_bonus_points ?? 0)
    : (booth?.max_bonus_points ?? 0)
  const bonusValid = bonus.trim() !== "" && Number.isInteger(bonusNumber) && bonusNumber >= 0 && bonusNumber <= maxBonus
  const nothingToGive = review?.mode === "bonus" && bonusNumber === 0

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Scan Poin Booth</h1>

      <section className={styles.panel}>
        <label className={styles.field}>
          <span className={styles.label}>Booth</span>
          <select
            className={styles.input}
            value={boothId}
            onChange={(e) => setBoothId(e.target.value)}
            disabled={phase.kind === "review" || phase.kind === "loading"}
          >
            {booths.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
                {b.assigned ? "" : " (bukan booth kamu)"}
              </option>
            ))}
          </select>
        </label>
        {booth ? (
          <p className={styles.note}>
            {booth.points} poin per pengunjung · bonus maks. {booth.max_bonus_points}
          </p>
        ) : null}

        {phase.kind === "scanning" ? (
          <>
            <QrCameraScanner onResult={handleScanned} onError={(message) => setPhase({ kind: "error", title: "Kamera", message })} />
            <button type="button" className={styles.secondaryBtn} onClick={() => setPhase({ kind: "idle" })}>
              Tutup kamera
            </button>
          </>
        ) : phase.kind === "idle" ? (
          <button type="button" className={styles.primaryBtn} onClick={() => setPhase({ kind: "scanning" })}>
            Scan QR pengunjung
          </button>
        ) : null}

        <div aria-live="polite">
          {phase.kind === "loading" ? <p className={styles.note}>{phase.label}</p> : null}

          {phase.kind === "error" ? (
            <div className={`${styles.result} ${styles.resultError}`}>
              <p className={styles.resultTitle}>{phase.title}</p>
              <p>{phase.message}</p>
              <button type="button" className={styles.secondaryBtn} onClick={() => setPhase({ kind: "scanning" })}>
                Scan lagi
              </button>
            </div>
          ) : null}

          {phase.kind === "done" ? (
            <div className={`${styles.result} ${phase.award.alreadyVisited ? styles.resultWarn : styles.resultOk}`}>
              <p className={styles.resultTitle}>
                {phase.award.alreadyVisited ? "Tidak ada poin baru" : `HOORAY! +${phase.award.pointsAwarded} poin`}
              </p>
              <p>
                {phase.award.visitor.fullName}
                {phase.award.mode === "bonus" && !phase.award.alreadyVisited ? " · bonus kunjungan ulang" : ""}
              </p>
              <p className={styles.note}>
                Total {phase.award.totalPoints} poin · {phase.award.totalVisited} booth
                {phase.award.skippedGate ? " · dicatat hadir (belum absen di gate)" : ""}
              </p>
              <button type="button" className={styles.primaryBtn} onClick={() => setPhase({ kind: "scanning" })}>
                Scan berikutnya
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {phase.kind === "review" && review ? (
        <div className={styles.backdrop} role="presentation">
          <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="review-title">
            <p className={styles.label}>{review.booth?.name ?? "Tanpa booth"}</p>
            <h2 id="review-title" className={styles.dialogTitle}>
              {review.visitor.fullName}
            </h2>
            {review.visitor.institution ? <p className={styles.note}>{review.visitor.institution}</p> : null}

            {warningScreens(review).map((screen) => (
              <div key={screen.key} className={styles.warning}>
                <p className={styles.warningTitle}>{screen.title}</p>
                <p>{screen.body}</p>
              </div>
            ))}
            {!review.checkedIn ? (
              <div className={styles.warning}>
                <p className={styles.warningTitle}>Belum absen di gate</p>
                <p>Tanyakan ke pengunjung. Jika poin diberikan, pengunjung dicatat hadir.</p>
              </div>
            ) : null}

            <dl className={styles.breakdown}>
              {review.mode === "visit" ? (
                <div>
                  <dt>Poin booth</dt>
                  <dd>{review.basePoints}</dd>
                </div>
              ) : null}
              <div>
                <dt>
                  <label htmlFor="bonus-input">Bonus</label>
                </dt>
                <dd>
                  <input
                    id="bonus-input"
                    className={`${styles.input} ${styles.bonusInput}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={maxBonus}
                    step={1}
                    value={bonus}
                    onChange={(e) => handleBonusChange(phase.qrCode, e.target.value)}
                    aria-invalid={!bonusValid}
                    aria-describedby="bonus-hint"
                  />
                </dd>
              </div>
              <div className={styles.total}>
                <dt>Total</dt>
                <dd>{refreshing ? "…" : review.pointsToAward}</dd>
              </div>
            </dl>
            <p id="bonus-hint" className={bonusValid ? styles.note : styles.fieldError}>
              {maxBonus > 0 ? `Bonus 0–${maxBonus}.` : "Bonus di booth ini sudah habis untuk pengunjung ini."}
            </p>

            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => {
                  stopRefresh()
                  setPhase({ kind: "idle" })
                }}
              >
                Batal
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                disabled={!bonusValid || refreshing || nothingToGive}
                onClick={() => handleConfirm(phase.qrCode)}
              >
                {review.mode === "bonus" ? "Beri bonus" : "Beri poin"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
