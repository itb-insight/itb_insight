"use client"

import { Camera, CheckCircle2, DoorOpen, Gift, ScanLine, Sparkles, X } from "lucide-react"
import { useState } from "react"

import PanelHifi from "@/features/admin-hifi/PanelHifi"
import boothStyles from "@/features/booth-points/BoothPointsScanner.module.css"
import { postWithAuth } from "@/features/dashboard/apiClient"
import QrCameraScanner from "@/shared/components/QrCameraScanner/QrCameraScanner"

import styles from "./GateScanner.module.css"

/*
  Gate scanner (/admin/gate), for gate staff and admins.
    1. Scan the visitor's profile QR (Dashboard -> Profil). POST /api/gate/scan sets
       profiles.entered_gate (0026, never reset) and checks the visitor ticket in.
    2. Show the visitor what a booth scan looks like: the same screen booth staff use
       (BoothPointsScanner), as a demo. Tapping an option here only shows the result locally:
       no request is sent and no points are given. Points come from booth staff only.
*/

type Visitor = { fullName: string; institution: string | null }
type GateScan = { visitor: Visitor; firstEntry: boolean; checkedInAt: string; ownAccount: boolean }
type DemoOption = "contribution" | "bonus"

type Phase =
  | { kind: "idle" }
  | { kind: "scanning" }
  | { kind: "busy" }
  | { kind: "error"; message: string }

type HistoryEntry = GateScan & { key: string }

const timeFormat = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

export default function GateScanner({
  contributionPoints,
  bonusPoints,
}: {
  contributionPoints: number
  bonusPoints: number
}) {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" })
  const [scan, setScan] = useState<GateScan | null>(null)
  const [demo, setDemo] = useState<DemoOption | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const busy = phase.kind === "busy"

  async function handleScanned(qrCode: string) {
    setPhase({ kind: "busy" })
    try {
      const res = await postWithAuth<GateScan>("/api/gate/scan", { qrCode })
      if (res.needsAuth) throw new Error("Sesi berakhir. Silakan login ulang.")
      if (!res.payload.success) throw new Error(res.payload.error.message)
      const result = res.payload.data
      setScan(result)
      setHistory((prev) => [{ ...result, key: `${result.checkedInAt}-${prev.length}` }, ...prev].slice(0, 50))
      setPhase({ kind: "idle" })
      navigator.vibrate?.(60)
    } catch (err) {
      setScan(null)
      setPhase({ kind: "error", message: err instanceof Error ? err.message : "Gagal membaca QR." })
    }
  }

  function startScan() {
    setScan(null)
    setDemo(null)
    setPhase({ kind: "scanning" })
  }

  const demoOptions: Array<{ option: DemoOption; title: string; detail: string; total: number; icon: typeof Gift }> = [
    {
      option: "contribution",
      title: "Contribution",
      detail: `+${contributionPoints} poin, untuk pengunjung yang aktif di booth`,
      total: contributionPoints,
      icon: Sparkles,
    },
    {
      option: "bonus",
      title: "Bonus",
      detail: `+${bonusPoints} poin tambahan, sekaligus Contribution (+${contributionPoints})`,
      total: bonusPoints + contributionPoints,
      icon: Gift,
    },
  ]

  return (
    <div className={boothStyles.layout}>
      <div className={boothStyles.column}>
        <PanelHifi title="1. Scan QR pengunjung" subtitle="QR ada di halaman profil pengunjung (Dashboard → Profil).">
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

            {scan && phase.kind === "idle" ? (
              <div className={`${boothStyles.result} ${boothStyles.resultOk}`}>
                <p className={boothStyles.resultTitle}>
                  <DoorOpen size={22} aria-hidden="true" />
                  {scan.firstEntry ? "Masuk gate tercatat" : "Sudah tercatat masuk sebelumnya"}
                </p>
                <p className={boothStyles.visitorName}>{scan.visitor.fullName}</p>
                {scan.visitor.institution ? <p className={boothStyles.muted}>{scan.visitor.institution}</p> : null}
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
        <PanelHifi title="Riwayat sesi ini" subtitle="Scan gate yang sudah tercatat di server, terbaru di atas.">
          {history.length === 0 ? (
            <p className={boothStyles.muted}>Belum ada.</p>
          ) : (
            <ul className={boothStyles.log}>
              {history.map((entry) => (
                <li key={entry.key} className={boothStyles.logRow}>
                  <span className={boothStyles.logName}>{entry.visitor.fullName}</span>
                  <span className={boothStyles.logOutcome}>{entry.firstEntry ? "Masuk" : "Sudah masuk"}</span>
                  <span className={boothStyles.muted}>{timeFormat.format(new Date(entry.checkedInAt))}</span>
                </li>
              ))}
            </ul>
          )}
        </PanelHifi>
      </div>
    </div>
  )
}
