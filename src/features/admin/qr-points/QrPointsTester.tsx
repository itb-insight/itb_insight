"use client"

import { Camera, Check, ScanLine, X } from "lucide-react"
import { useState } from "react"

import { postWithAuth } from "@/features/dashboard/apiClient"

import QrCameraScanner from "./QrCameraScanner"
import styles from "./QrPointsTester.module.css"

type BoothOption = { id: string; name: string }

type Visitor = { userId: string; fullName: string; institution: string | null }

type BoothRef = { id: string; name: string } | null // null = manual admin award

type Preview = {
  booth: BoothRef
  visitor: Visitor
  checkedIn: boolean
  alreadyVisited: boolean
  pointsToAward: number
}

type Award = {
  booth: BoothRef
  visitor: Visitor
  pointsAwarded: number
  alreadyVisited: boolean
  skippedGate: boolean
  totalPoints: number
  totalVisited: number
}

type LogEntry = { at: string; name: string; booth: string; outcome: string }

type Phase =
  | { kind: "idle" }
  | { kind: "scanning" }
  | { kind: "loading"; label: string }
  | { kind: "confirm"; qrCode: string; preview: Preview }
  | { kind: "done"; award: Award }
  | { kind: "error"; message: string }

const MAX_POINTS = 1000 // mirrors MAX_ADMIN_POINTS in src/lib/booths.ts
const boothLabel = (booth: BoothRef) => booth?.name ?? "Tanpa booth"

// TEMPORARY admin test bench: scan a personal QR, preview who it is, confirm, award points.
export default function QrPointsTester({ booths }: { booths: BoothOption[] }) {
  const [boothId, setBoothId] = useState("") // "" = no booth
  const [points, setPoints] = useState("10")
  const [phase, setPhase] = useState<Phase>({ kind: "idle" })
  const [log, setLog] = useState<LogEntry[]>([])

  const pointsNumber = Number(points)
  const pointsValid = points.trim() !== "" && Number.isInteger(pointsNumber) && pointsNumber >= 0 && pointsNumber <= MAX_POINTS
  const canScan = pointsValid && phase.kind !== "loading"

  const addLog = (entry: Omit<LogEntry, "at">) =>
    setLog((prev) => [{ at: new Date().toLocaleTimeString("id-ID"), ...entry }, ...prev].slice(0, 20))

  async function call<T>(body: Record<string, unknown>) {
    const res = await postWithAuth<T>("/api/booths/scan", { boothId: boothId || undefined, points: pointsNumber, ...body })
    if (res.needsAuth) throw new Error("Sesi berakhir. Silakan login ulang.")
    if (!res.payload.success) throw new Error(res.payload.error.message)
    return res.payload.data
  }

  async function handleScanned(qrCode: string) {
    setPhase({ kind: "loading", label: "Mencari pengunjung…" })
    try {
      const preview = await call<Preview>({ qrCode, dryRun: true })
      setPhase({ kind: "confirm", qrCode, preview })
    } catch (err) {
      setPhase({ kind: "error", message: err instanceof Error ? err.message : "Gagal membaca QR." })
    }
  }

  async function handleConfirm(qrCode: string, preview: Preview) {
    setPhase({ kind: "loading", label: "Memberi poin…" })
    try {
      const award = await call<Award>({ qrCode, confirmSkippedGate: true })
      setPhase({ kind: "done", award })
      addLog({
        name: award.visitor.fullName,
        booth: boothLabel(award.booth),
        outcome: award.alreadyVisited ? "sudah pernah (0)" : `+${award.pointsAwarded}`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memberi poin."
      setPhase({ kind: "error", message })
      addLog({ name: preview.visitor.fullName, booth: boothLabel(preview.booth), outcome: "gagal" })
    }
  }

  function handleCancel(preview: Preview) {
    addLog({ name: preview.visitor.fullName, booth: boothLabel(preview.booth), outcome: "dibatalkan" })
    setPhase({ kind: "idle" })
  }

  return (
    <div className={styles.layout}>
      <section className={styles.panel} aria-labelledby="scan-heading">
        <h2 id="scan-heading" className={styles.panelTitle}>Pindai &amp; beri poin</h2>

        <label className={styles.field}>
          <span className={styles.label}>Booth (opsional)</span>
          <select className={styles.input} value={boothId} onChange={(e) => setBoothId(e.target.value)}>
            <option value="">Tanpa booth (uji admin)</option>
            {booths.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>

        {phase.kind === "scanning" ? (
          <>
            <QrCameraScanner
              onResult={handleScanned}
              onError={(message) => setPhase({ kind: "error", message })}
            />
            <button type="button" className={styles.secondaryBtn} onClick={() => setPhase({ kind: "idle" })}>
              <X size={18} aria-hidden="true" /> Tutup kamera
            </button>
          </>
        ) : (
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={!canScan}
            onClick={() => setPhase({ kind: "scanning" })}
          >
            <Camera size={20} aria-hidden="true" /> Scan QR
          </button>
        )}

        <label className={styles.field}>
          <span className={styles.label}>Jumlah poin</span>
          <input
            className={styles.input}
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_POINTS}
            step={1}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            aria-invalid={!pointsValid}
          />
          {!pointsValid && <span className={styles.fieldError}>Bilangan bulat 0–{MAX_POINTS}.</span>}
        </label>

        <div aria-live="polite">
          {phase.kind === "loading" && <p className={styles.status}>{phase.label}</p>}

          {phase.kind === "error" && (
            <div className={`${styles.result} ${styles.resultError}`}>
              <p className={styles.resultTitle}>Gagal</p>
              <p>{phase.message}</p>
              <button type="button" className={styles.secondaryBtn} onClick={() => setPhase({ kind: "scanning" })}>
                <ScanLine size={18} aria-hidden="true" /> Scan lagi
              </button>
            </div>
          )}

          {phase.kind === "done" && (
            <div className={`${styles.result} ${phase.award.alreadyVisited ? styles.resultWarn : styles.resultOk}`}>
              <p className={styles.resultTitle}>
                {phase.award.alreadyVisited ? "Sudah pernah diberi poin di booth ini" : `+${phase.award.pointsAwarded} poin`}
              </p>
              <p>
                {phase.award.visitor.fullName} · {boothLabel(phase.award.booth)}
              </p>
              <p className={styles.muted}>
                Total {phase.award.totalPoints} poin dari {phase.award.totalVisited} booth
                {phase.award.skippedGate ? " · dicatat hadir (skipped gate)" : ""}
              </p>
              <button type="button" className={styles.secondaryBtn} onClick={() => setPhase({ kind: "scanning" })}>
                <ScanLine size={18} aria-hidden="true" /> Scan berikutnya
              </button>
            </div>
          )}
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="log-heading">
        <h2 id="log-heading" className={styles.panelTitle}>Riwayat sesi ini</h2>
        {log.length === 0 ? (
          <p className={styles.muted}>Belum ada scan.</p>
        ) : (
          <ul className={styles.log}>
            {log.map((entry, i) => (
              <li key={`${entry.at}-${i}`} className={styles.logRow}>
                <span className={styles.logName}>{entry.name}</span>
                <span className={styles.muted}>
                  {entry.booth} · {entry.at}
                </span>
                <span className={styles.logOutcome}>{entry.outcome}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {phase.kind === "confirm" && (
        <div className={styles.backdrop} role="presentation">
          <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <p className={styles.label}>QR terbaca</p>
            <h3 id="confirm-title" className={styles.dialogTitle}>
              Beri {phase.preview.pointsToAward} poin ke {phase.preview.visitor.fullName}?
            </h3>
            <p className={styles.muted}>
              {phase.preview.visitor.institution ? `${phase.preview.visitor.institution} · ` : ""}
              {boothLabel(phase.preview.booth)}
            </p>
            {phase.preview.alreadyVisited && (
              <p className={styles.warn}>Pengunjung ini sudah pernah diberi poin di booth ini; poin tidak akan bertambah.</p>
            )}
            {phase.preview.booth && !phase.preview.checkedIn && (
              <p className={styles.warn}>Belum absen di gate. Jika diberi poin, pengunjung dicatat hadir (skipped gate).</p>
            )}
            <div className={styles.dialogActions}>
              <button type="button" className={styles.secondaryBtn} onClick={() => handleCancel(phase.preview)}>
                <X size={18} aria-hidden="true" /> Tidak
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => handleConfirm(phase.qrCode, phase.preview)}
                autoFocus
              >
                <Check size={18} aria-hidden="true" /> Beri poin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
