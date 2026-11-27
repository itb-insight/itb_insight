"use client"

import { Camera, CheckCircle2, Gift, ScanLine, Sparkles, X } from "lucide-react"
import { useState } from "react"

import { postWithAuth } from "@/features/dashboard/apiClient"
import PanelHifi from "@/features/admin-hifi/PanelHifi"
import {
  markGiven,
  NOTHING_GIVEN,
  planBoothAward,
  type AwardPlan,
  type BoothPointOption,
  type GivenOptions,
  type PracticeBooth,
} from "@/lib/booth-points"
import QrCameraScanner from "@/shared/components/QrCameraScanner/QrCameraScanner"

import styles from "./BoothPointsScanner.module.css"

/*
  Booth points scanner (/admin/booth). Rules: src/lib/booth-points.ts.
    1. Scan the visitor's profile QR (dashboard -> profil).
    2. Below it, pick the booth (only when the account has more than one).
    3. Contribution or Bonus, each once per visitor per booth.
  POST /api/booth-points/scan checks the role and the booth, resolves the visitor and confirms it
  received the award. PRACTICE: no points are added; what was given is remembered in this tab
  (sessionStorage) so the once-per-option rule can still be shown.
*/

type Visitor = { key: string; fullName: string; institution: string | null }
type ScanNote = "committee_account" | "own_account"

type Lookup = { booth: PracticeBooth; visitor: Visitor; notes: ScanNote[] }
type Award = Lookup & { plan: AwardPlan; receivedAt: string; reference: string }

type Scanned = { qrCode: string; visitor: Visitor; notes: ScanNote[] }

type Phase =
  | { kind: "idle" }
  | { kind: "scanning" }
  | { kind: "busy"; label: string }
  | { kind: "error"; message: string }

type HistoryEntry = Award & { practice: boolean }

const LEDGER_KEY = "itbi:booth-points:practice-ledger"

type Ledger = Record<string, GivenOptions>

function readLedger(): Ledger {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.sessionStorage.getItem(LEDGER_KEY)
    return raw ? (JSON.parse(raw) as Ledger) : {}
  } catch {
    return {}
  }
}

function writeLedger(ledger: Ledger) {
  try {
    window.sessionStorage.setItem(LEDGER_KEY, JSON.stringify(ledger))
  } catch {
    // Private mode / storage blocked: the rule still holds until the page reloads.
  }
}

const ledgerKey = (boothId: string, visitorKey: string) => `${boothId}:${visitorKey}`

const NOTE_TEXT: Record<ScanNote, string> = {
  committee_account: "Ini akun panitia. Saat live, akun panitia tidak bisa menerima poin. Untuk latihan tetap boleh.",
  own_account: "Ini akunmu sendiri. Saat live, kamu tidak bisa memberi poin ke akun sendiri.",
}

const timeFormat = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

function formatPlan(plan: AwardPlan): string {
  if (plan.option === "contribution") return `+${plan.contribution} Contribution`
  return plan.contribution > 0 ? `+${plan.bonus} Bonus + ${plan.contribution} Contribution` : `+${plan.bonus} Bonus`
}

export default function BoothPointsScanner({
  booths,
  practice,
  contributionPoints,
  bonusPoints,
}: {
  booths: PracticeBooth[]
  practice: boolean
  contributionPoints: number
  bonusPoints: number
}) {
  const [boothId, setBoothId] = useState(booths[0]?.id ?? "")
  const [phase, setPhase] = useState<Phase>({ kind: "idle" })
  const [scanned, setScanned] = useState<Scanned | null>(null)
  const [lastAward, setLastAward] = useState<Award | null>(null)
  const [ledger, setLedger] = useState<Ledger>(readLedger)
  const [history, setHistory] = useState<HistoryEntry[]>([])

  const booth = booths.find((b) => b.id === boothId) ?? null
  const given = scanned && booth ? (ledger[ledgerKey(booth.id, scanned.visitor.key)] ?? NOTHING_GIVEN) : NOTHING_GIVEN
  const busy = phase.kind === "busy"

  if (booths.length === 0) {
    return (
      <PanelHifi title="Belum ada booth" subtitle="Akunmu punya akses Booth, tapi belum ditugaskan ke booth mana pun.">
        <p className={styles.muted}>
          Minta admin mengisi booth untukmu (profiles.role_c, misalnya <code>all</code> untuk semua booth).
        </p>
      </PanelHifi>
    )
  }

  async function call<T>(body: Record<string, unknown>): Promise<T> {
    const res = await postWithAuth<T>("/api/booth-points/scan", body)
    if (res.needsAuth) throw new Error("Sesi berakhir. Silakan login ulang.")
    if (!res.payload.success) throw new Error(res.payload.error.message)
    return res.payload.data
  }

  async function handleScanned(qrCode: string) {
    setPhase({ kind: "busy", label: "Mencari pengunjung…" })
    setLastAward(null)
    try {
      const lookup = await call<Lookup>({ qrCode, boothId })
      setScanned({ qrCode, visitor: lookup.visitor, notes: lookup.notes })
      setPhase({ kind: "idle" })
    } catch (err) {
      setScanned(null)
      setPhase({ kind: "error", message: err instanceof Error ? err.message : "Gagal membaca QR." })
    }
  }

  async function handleGive(option: BoothPointOption) {
    if (!scanned || !booth) return
    setPhase({ kind: "busy", label: "Mengirim ke server…" })
    try {
      const award = await call<Award>({ qrCode: scanned.qrCode, boothId: booth.id, option, given })
      const key = ledgerKey(booth.id, scanned.visitor.key)
      const next = { ...ledger, [key]: markGiven(given, option) }
      setLedger(next)
      writeLedger(next)
      setLastAward(award)
      setHistory((prev) => [{ ...award, practice }, ...prev].slice(0, 30))
      setPhase({ kind: "idle" })
      navigator.vibrate?.(60)
    } catch (err) {
      setPhase({ kind: "error", message: err instanceof Error ? err.message : "Gagal mengirim poin." })
    }
  }

  function startScan() {
    setScanned(null)
    setLastAward(null)
    setPhase({ kind: "scanning" })
  }

  const options: Array<{ option: BoothPointOption; title: string; detail: string; icon: typeof Gift }> = [
    {
      option: "contribution",
      title: "Contribution",
      detail: `+${contributionPoints} poin, untuk pengunjung yang aktif di booth`,
      icon: Sparkles,
    },
    {
      option: "bonus",
      title: "Bonus",
      detail:
        given.contribution || given.bonus
          ? `+${bonusPoints} poin tambahan`
          : `+${bonusPoints} poin tambahan, sekaligus Contribution (+${contributionPoints})`,
      icon: Gift,
    },
  ]

  return (
    <div className={styles.layout}>
      <div className={styles.column}>
        {practice ? (
          <p className={styles.practice} role="note">
            <strong>Mode latihan.</strong> Scan dan tombol bekerja seperti aslinya dan server mengonfirmasi tiap
            pengiriman, tapi poin tidak benar-benar ditambahkan.
          </p>
        ) : null}

        <PanelHifi title="1. Scan QR pengunjung" subtitle="QR ada di halaman profil pengunjung (Dashboard → Profil).">
          {phase.kind === "scanning" ? (
            <>
              <QrCameraScanner onResult={handleScanned} onError={(message) => setPhase({ kind: "error", message })} />
              <button type="button" className={styles.secondaryBtn} onClick={() => setPhase({ kind: "idle" })}>
                <X size={18} aria-hidden="true" /> Tutup kamera
              </button>
            </>
          ) : scanned ? (
            <div className={styles.visitor}>
              <p className={styles.visitorLabel}>Pengunjung</p>
              <p className={styles.visitorName}>{scanned.visitor.fullName}</p>
              {scanned.visitor.institution ? <p className={styles.muted}>{scanned.visitor.institution}</p> : null}
              {scanned.notes.map((note) => (
                <p key={note} className={styles.note}>
                  {NOTE_TEXT[note]}
                </p>
              ))}
              <button type="button" className={styles.secondaryBtn} onClick={startScan} disabled={busy}>
                <ScanLine size={18} aria-hidden="true" /> Scan pengunjung lain
              </button>
            </div>
          ) : (
            <button type="button" className={styles.primaryBtn} onClick={startScan} disabled={busy}>
              <Camera size={22} aria-hidden="true" /> Buka kamera &amp; scan
            </button>
          )}

          <label className={styles.field}>
            <span className={styles.fieldLabel}>2. Scan untuk booth</span>
            {booths.length > 1 ? (
              <select
                className={styles.select}
                value={boothId}
                onChange={(e) => setBoothId(e.target.value)}
                disabled={busy}
              >
                {booths.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className={styles.boothFixed}>{booth?.name}</span>
            )}
          </label>
        </PanelHifi>

        <PanelHifi
          title="3. Beri poin"
          subtitle={
            scanned
              ? `Untuk ${scanned.visitor.fullName} di ${booth?.name ?? "booth"}. Masing-masing sekali per pengunjung per booth.`
              : "Scan QR pengunjung dulu."
          }
        >
          <div className={styles.options}>
            {options.map(({ option, title, detail, icon: Icon }) => {
              const plan = planBoothAward(given, option)
              const used = Boolean(scanned) && !plan
              return (
                <button
                  key={option}
                  type="button"
                  className={`${styles.optionBtn} ${option === "bonus" ? styles.optionBonus : ""}`}
                  disabled={!scanned || !plan || busy}
                  onClick={() => handleGive(option)}
                >
                  <Icon size={26} aria-hidden="true" className={styles.optionIcon} />
                  <span className={styles.optionText}>
                    <span className={styles.optionTitle}>{title}</span>
                    <span className={styles.optionDetail}>{used ? "Sudah diberikan" : detail}</span>
                  </span>
                  {plan && scanned ? <span className={styles.optionTotal}>+{plan.total}</span> : null}
                </button>
              )
            })}
          </div>

          <div aria-live="polite">
            {phase.kind === "busy" ? <p className={styles.status}>{phase.label}</p> : null}

            {phase.kind === "error" ? (
              <div className={`${styles.result} ${styles.resultError}`}>
                <p className={styles.resultTitle}>Gagal</p>
                <p>{phase.message}</p>
                <button type="button" className={styles.secondaryBtn} onClick={startScan}>
                  <ScanLine size={18} aria-hidden="true" /> Scan lagi
                </button>
              </div>
            ) : null}

            {lastAward && phase.kind === "idle" ? (
              <div className={`${styles.result} ${styles.resultOk}`}>
                <p className={styles.resultTitle}>
                  <CheckCircle2 size={22} aria-hidden="true" /> Sinyal diterima server
                </p>
                <p>
                  {formatPlan(lastAward.plan)} untuk {lastAward.visitor.fullName} · {lastAward.booth.name}
                </p>
                <p className={styles.muted}>
                  Diterima {timeFormat.format(new Date(lastAward.receivedAt))} · ref {lastAward.reference}
                  {practice ? " · latihan, poin tidak ditambahkan" : ""}
                </p>
                <button type="button" className={styles.primaryBtn} onClick={startScan}>
                  <ScanLine size={20} aria-hidden="true" /> Scan pengunjung berikutnya
                </button>
              </div>
            ) : null}
          </div>
        </PanelHifi>
      </div>

      <div className={styles.column}>
        <PanelHifi title="Riwayat sesi ini" subtitle="Pengiriman yang sudah dikonfirmasi server, terbaru di atas.">
          {history.length === 0 ? (
            <p className={styles.muted}>Belum ada.</p>
          ) : (
            <ul className={styles.log}>
              {history.map((entry) => (
                <li key={entry.reference} className={styles.logRow}>
                  <span className={styles.logName}>{entry.visitor.fullName}</span>
                  <span className={styles.logOutcome}>{formatPlan(entry.plan)}</span>
                  <span className={styles.muted}>
                    {entry.booth.name} · {timeFormat.format(new Date(entry.receivedAt))} · ref {entry.reference}
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
