"use client"

import { Camera, CheckCircle2, ChevronDown, ChevronUp, CloudOff, DoorOpen, Gift, ScanLine, Sparkles, Users, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import PanelHifi from "@/features/admin-hifi/PanelHifi"
import boothStyles from "@/features/booth-points/BoothPointsScanner.module.css"
import { dedupeKey, qrTail, type QueueEntry } from "@/features/offline-queue/queue"
import QueueStatus from "@/features/offline-queue/QueueStatus"
import { sendScan } from "@/features/offline-queue/send"
import { useOfflineQueue } from "@/features/offline-queue/useOfflineQueue"
import { warmPages } from "@/shared/components/Pwa/swClient"
import QrCameraScanner from "@/shared/components/QrCameraScanner/QrCameraScanner"

import styles from "./GateScanner.module.css"

/*
  Gate scanner (/admin/gate), for gate staff and admins.
    1. Scan the visitor's profile QR (Dashboard -> Profil). POST /api/gate/scan sets
       profiles.entered_gate (0026, never reset) and checks the visitor ticket in.
       With "mewakili lebih dari satu pengunjung" ticked, the scan also saves how many other people
       the visitor stands for (parents, teachers; profiles.represented_count, 0027). The box is
       cleared after each scan so the number is not carried over to the next visitor.
    2. Show the visitor what a booth scan looks like: the same screen booth staff use
       (BoothPointsScanner), as a demo. Tapping an option here only shows the result locally:
       no request is sent and no points are given. Points come from booth staff only.
  No signal (docs/OFFLINE.md): the scan is stored on the phone with its capture time
  (src/features/offline-queue) and sent automatically when the signal is back. A ticket checks in
  once, so sending it twice is harmless.
*/

type Visitor = { fullName: string; institution: string | null }
type GateScan = {
  visitor: Visitor
  firstEntry: boolean
  checkedInAt: string
  ownAccount: boolean
  /** Saved by this scan; null = not changed. */
  represents: number | null
}
type DemoOption = "contribution" | "bonus"

type Phase =
  | { kind: "idle" }
  | { kind: "scanning" }
  | { kind: "busy" }
  | { kind: "error"; message: string }

type HistoryEntry = GateScan & { key: string; fromQueue?: boolean }

const timeFormat = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

export default function GateScanner({
  contributionPoints,
  bonusPoints,
  maxRepresented,
  staffUserId,
}: {
  contributionPoints: number
  bonusPoints: number
  maxRepresented: number
  staffUserId: string
}) {
  const [representing, setRepresenting] = useState(false)
  // Text, so the field can be cleared while typing; read with representedCount().
  const [countText, setCountText] = useState("1")
  const [phase, setPhase] = useState<Phase>({ kind: "idle" })
  const [scan, setScan] = useState<GateScan | null>(null)
  const [demo, setDemo] = useState<DemoOption | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [queuedLabel, setQueuedLabel] = useState<string | null>(null)
  const busy = phase.kind === "busy"

  // A queued check-in that reached the server joins the session history.
  const onSent = useCallback((entry: QueueEntry, data: unknown) => {
    if (entry.kind !== "gate" || !data) return
    const result = data as GateScan
    setHistory((prev) => [{ ...result, key: `${entry.id}`, fromQueue: true }, ...prev].slice(0, 50))
  }, [])
  const queue = useOfflineQueue(staffUserId, { onSent })

  // Keep this scanner (and the map) usable offline: cache the page and its scripts.
  useEffect(() => warmPages(["/admin/gate", "/event-map"]), [])

  const clampCount = (value: number) => Math.min(maxRepresented, Math.max(1, Math.round(value)))
  const representedCount = () => {
    const value = Number.parseInt(countText, 10)
    return Number.isFinite(value) ? clampCount(value) : 1
  }
  const stepCount = (delta: number) => setCountText(String(clampCount(representedCount() + delta)))

  async function handleScanned(qrCode: string) {
    setPhase({ kind: "busy" })
    setQueuedLabel(null)
    const body = { qrCode, ...(representing ? { represents: representedCount() } : {}) }
    const sent = await sendScan<GateScan>("gate", body)
    const result = sent.result
    if (result.type === "network" || result.type === "auth" || (result.type === "response" && result.status >= 500)) {
      // No signal (or the server failed): keep it on the phone and send it later.
      const label = `QR …${qrTail(qrCode)}${"represents" in body ? ` · +${body.represents} diwakili` : ""}`
      await queue.enqueue({ kind: "gate", dedupeKey: dedupeKey("gate", qrCode), label, body })
      setScan(null)
      setRepresenting(false)
      setCountText("1")
      setQueuedLabel(label)
      setPhase({ kind: "idle" })
      navigator.vibrate?.([40, 60, 40])
      return
    }
    if (!sent.payload || !sent.payload.success) {
      setScan(null)
      setPhase({
        kind: "error",
        message: sent.payload && !sent.payload.success ? sent.payload.error.message : "Sesi berakhir. Silakan login ulang.",
      })
      return
    }
    const scanResult = sent.payload.data
    setScan(scanResult)
    setRepresenting(false)
    setCountText("1")
    setHistory((prev) => [{ ...scanResult, key: `${scanResult.checkedInAt}-${prev.length}` }, ...prev].slice(0, 50))
    setPhase({ kind: "idle" })
    navigator.vibrate?.(60)
  }

  function startScan() {
    setScan(null)
    setDemo(null)
    setQueuedLabel(null)
    setPhase({ kind: "scanning" })
  }

  const demoOptions: Array<{ option: DemoOption; title: string; detail: string; total: number; icon: typeof Gift }> = [
    {
      option: "contribution",
      title: "Visited",
      detail: `+${contributionPoints} poin untuk pengunjung yang datang ke booth `,
      total: contributionPoints,
      icon: Sparkles,
    },
    {
      option: "bonus",
      title: "Bonus",
      detail: `+${bonusPoints} poin tambahan untuk pengunjung yang aktif di booth, sekaligus Contribution (+${contributionPoints})`,
      total: bonusPoints + contributionPoints,
      icon: Gift,
    },
  ]

  return (
    <div className={boothStyles.layout}>
      <div className={boothStyles.column}>
        <PanelHifi title="1. Scan QR pengunjung" subtitle="QR ada di halaman profil pengunjung (Dashboard → Profil).">
          <div className={styles.represent}>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={representing}
                disabled={busy}
                onChange={(e) => setRepresenting(e.target.checked)}
              />
              <span>User ini mewakili lebih dari satu pengunjung</span>
            </label>

            {representing ? (
              <div className={styles.countField}>
                <label htmlFor="gate-represented-count" className={styles.countLabel}>
                  Jumlah orang yang diwakili <span className={boothStyles.muted}>(selain pemilik akun)</span>
                </label>
                <div className={styles.stepper}>
                  <input
                    id="gate-represented-count"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={maxRepresented}
                    step={1}
                    className={styles.countInput}
                    value={countText}
                    disabled={busy}
                    onChange={(e) => setCountText(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    onBlur={() => setCountText(String(representedCount()))}
                  />
                  <div className={styles.arrows}>
                    <button
                      type="button"
                      className={styles.arrowBtn}
                      aria-label="Tambah satu"
                      disabled={busy || representedCount() >= maxRepresented}
                      onClick={() => stepCount(1)}
                    >
                      <ChevronUp size={18} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={styles.arrowBtn}
                      aria-label="Kurangi satu"
                      disabled={busy || representedCount() <= 1}
                      onClick={() => stepCount(-1)}
                    >
                      <ChevronDown size={18} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <p className={boothStyles.muted}>
                  Misalnya orang tua dengan 2 anak: isi 2. Berlaku untuk scan berikutnya, lalu kotak ini kosong lagi.
                </p>
              </div>
            ) : null}
          </div>

          {phase.kind === "scanning" ? (
            <>
              <QrCameraScanner onResult={handleScanned} onError={(message) => setPhase({ kind: "error", message })} />
              <button type="button" className={boothStyles.secondaryBtn} onClick={() => setPhase({ kind: "idle" })}>
                <X size={18} aria-hidden="true" /> Tutup kamera
              </button>
            </>
          ) : (
            <button type="button" className={boothStyles.primaryBtn} onClick={startScan} disabled={busy}>
              <Camera size={22} aria-hidden="true" /> {scan ? "Scan pengunjung berikutnya" : "Buka kamera & scan"}
            </button>
          )}

          <div aria-live="polite">
            {busy ? <p className={boothStyles.status}>Mencatat masuk gate…</p> : null}

            {phase.kind === "error" ? (
              <div className={`${boothStyles.result} ${boothStyles.resultError}`}>
                <p className={boothStyles.resultTitle}>Gagal</p>
                <p>{phase.message}</p>
                <button type="button" className={boothStyles.secondaryBtn} onClick={startScan}>
                  <ScanLine size={18} aria-hidden="true" /> Scan lagi
                </button>
              </div>
            ) : null}

            {queuedLabel && phase.kind === "idle" ? (
              <div className={`${boothStyles.result} ${boothStyles.resultQueued}`}>
                <p className={boothStyles.resultTitle}>
                  <CloudOff size={22} aria-hidden="true" /> Tersimpan di HP
                </p>
                <p>{queuedLabel}</p>
                <p className={boothStyles.muted}>
                  Tanpa sinyal: masuk gate dicatat otomatis dengan jam scan ini begitu sinyal kembali. Pengunjung boleh
                  masuk.
                </p>
              </div>
            ) : null}

            {scan && phase.kind === "idle" ? (
              <div className={`${boothStyles.result} ${boothStyles.resultOk}`}>
                <p className={boothStyles.resultTitle}>
                  <DoorOpen size={22} aria-hidden="true" />
                  {scan.firstEntry ? "Masuk gate tercatat" : "Sudah tercatat masuk sebelumnya"}
                </p>
                <p className={boothStyles.visitorName}>{scan.visitor.fullName}</p>
                {scan.visitor.institution ? <p className={boothStyles.muted}>{scan.visitor.institution}</p> : null}
                {scan.represents ? (
                  <p className={styles.representedNote}>
                    <Users size={18} aria-hidden="true" /> Mewakili {scan.represents} orang lain · total{" "}
                    {scan.represents + 1} orang
                  </p>
                ) : null}
                {scan.ownAccount ? <p className={boothStyles.note}>Ini akunmu sendiri.</p> : null}
                <p className={boothStyles.muted}>Check-in {timeFormat.format(new Date(scan.checkedInAt))}</p>
              </div>
            ) : null}
          </div>
        </PanelHifi>

        <PanelHifi
          title="2. Begini tampilannya di booth"
          subtitle={
            scan
              ? `Tunjukkan ke ${scan.visitor.fullName}: staf booth men-scan QR yang sama, lalu memilih poinnya.`
              : "Scan QR pengunjung dulu, lalu tunjukkan layar ini."
          }
        >
          <p className={styles.demoBadge} role="note">
            <strong>Contoh saja.</strong> Tombol di bawah tidak mengirim apa pun; poin hanya diberikan oleh staf booth.
          </p>

          {scan ? (
            <div className={boothStyles.visitor}>
              <p className={boothStyles.visitorLabel}>Pengunjung</p>
              <p className={boothStyles.visitorName}>{scan.visitor.fullName}</p>
              {scan.visitor.institution ? <p className={boothStyles.muted}>{scan.visitor.institution}</p> : null}
            </div>
          ) : null}

          <div className={boothStyles.options}>
            {demoOptions.map(({ option, title, detail, total, icon: Icon }) => (
              <button
                key={option}
                type="button"
                className={`${boothStyles.optionBtn} ${option === "bonus" ? boothStyles.optionBonus : ""}`}
                disabled={!scan || busy}
                aria-pressed={demo === option}
                onClick={() => setDemo(option)}
              >
                <Icon size={26} aria-hidden="true" className={boothStyles.optionIcon} />
                <span className={boothStyles.optionText}>
                  <span className={boothStyles.optionTitle}>{title}</span>
                  <span className={boothStyles.optionDetail}>{detail}</span>
                </span>
                {scan ? <span className={boothStyles.optionTotal}>+{total}</span> : null}
              </button>
            ))}
          </div>

          {scan && demo ? (
            <div className={`${boothStyles.result} ${boothStyles.resultOk}`} aria-live="polite">
              <p className={boothStyles.resultTitle}>
                <CheckCircle2 size={22} aria-hidden="true" /> Poin masuk ke akun pengunjung
              </p>
              <p>
                {demo === "contribution"
                  ? `+${contributionPoints} Contribution`
                  : `+${bonusPoints} Bonus + ${contributionPoints} Contribution`}{" "}
                untuk {scan.visitor.fullName}
              </p>
              <p className={boothStyles.muted}>Contoh tampilan · tidak ada poin yang ditambahkan</p>
            </div>
          ) : null}
        </PanelHifi>
      </div>

      <div className={boothStyles.column}>
        <QueueStatus queue={queue} />

        <PanelHifi title="Riwayat sesi ini" subtitle="Scan gate yang sudah tercatat di server, terbaru di atas.">
          {history.length === 0 ? (
            <p className={boothStyles.muted}>Belum ada.</p>
          ) : (
            <ul className={boothStyles.log}>
              {history.map((entry) => (
                <li key={entry.key} className={boothStyles.logRow}>
                  <span className={boothStyles.logName}>{entry.visitor.fullName}</span>
                  <span className={boothStyles.logOutcome}>
                    {entry.firstEntry ? "Masuk" : "Sudah masuk"}
                    {entry.represents ? ` · +${entry.represents} diwakili` : ""}
                  </span>
                  <span className={boothStyles.muted}>
                    {timeFormat.format(new Date(entry.checkedInAt))}
                    {entry.fromQueue ? " · dari antrean" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </PanelHifi>
      </div>
    </div>
  )
}
