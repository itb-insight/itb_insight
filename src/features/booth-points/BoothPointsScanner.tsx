"use client"

import { Camera, CheckCircle2, Gift, ScanLine, Sparkles, X } from "lucide-react"
import { useRef, useState } from "react"

import { postWithAuth } from "@/features/dashboard/apiClient"
import PanelHifi from "@/features/admin-hifi/PanelHifi"
import {
  groupBoothsByCategory,
  NOTHING_GIVEN,
  planBoothAward,
  type AwardPlan,
  type BoothPointOption,
  type GivenOptions,
  type PointsBooth,
} from "@/lib/booth-points"
import QrCameraScanner from "@/shared/components/QrCameraScanner/QrCameraScanner"

import styles from "./BoothPointsScanner.module.css"

/*
  Booth points scanner (/admin/booth), Insight Arcade. Rules: src/lib/booth-points.ts.
    1. Scan the visitor's profile QR (dashboard -> profil).
    2. Below it, pick the booth (only when the account has more than one), grouped by event.
    3. Contribution or Bonus, each once per visitor per booth; the amounts are the booth's own.
  POST /api/booth-points/scan checks the role and the booth, resolves the visitor, and writes the
  award through public.arcade_award_booth. What the visitor already has at the booth comes from the
  server. Each award attempt carries a clientRef that is reused when the same award is retried
  after a network error, so a retry never counts twice.
*/

type Visitor = { key: string; fullName: string; institution: string | null }

type Lookup = { booth: PointsBooth; visitor: Visitor; given: GivenOptions }
type Award = Lookup & { plan: AwardPlan; receivedAt: string; reference: string; duplicate: boolean }

type Scanned = { qrCode: string; visitor: Visitor; given: GivenOptions; boothId: string }

type Phase =
  | { kind: "idle" }
  | { kind: "scanning" }
  | { kind: "busy"; label: string }
  | { kind: "error"; message: string }

class ScanRequestError extends Error {
  constructor(
    message: string,
    readonly code: string | null,
    readonly given: GivenOptions | null,
    /** True when the request may not have reached the server (retry with the same clientRef). */
    readonly network: boolean,
  ) {
    super(message)
  }
}

const timeFormat = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

function formatPlan(plan: AwardPlan): string {
  if (plan.option === "contribution") return `+${plan.contribution} Contribution`
  return plan.contribution > 0 ? `+${plan.bonus} Bonus + ${plan.contribution} Contribution` : `+${plan.bonus} Bonus`
}

function newClientRef(): string {
  const webCrypto = globalThis.crypto
  if (typeof webCrypto.randomUUID === "function") return webCrypto.randomUUID()
  // Fallback for old browsers: RFC 4122 v4 from getRandomValues.
  const bytes = webCrypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export default function BoothPointsScanner({ booths, practice }: { booths: PointsBooth[]; practice: boolean }) {
  const boothGroups = groupBoothsByCategory(booths)
  const [boothId, setBoothId] = useState(boothGroups[0]?.booths[0]?.id ?? "")
  const [phase, setPhase] = useState<Phase>({ kind: "idle" })
  const [scanned, setScanned] = useState<Scanned | null>(null)
  const [lastAward, setLastAward] = useState<Award | null>(null)
  const [history, setHistory] = useState<Award[]>([])
  // Award attempts not yet confirmed, keyed by visitor:booth:option -> clientRef.
  const pendingRefs = useRef(new Map<string, string>())

  const booth = booths.find((b) => b.id === boothId) ?? null
  const given = scanned && scanned.boothId === boothId ? scanned.given : NOTHING_GIVEN
  const busy = phase.kind === "busy"

  if (booths.length === 0) {
    return (
      <PanelHifi title="Belum ada booth" subtitle="Akunmu punya akses Booth, tapi belum ditugaskan ke booth mana pun.">
        <p className={styles.muted}>
          Minta stakeholder booth menambahkan booth untuk emailmu di halaman Akses Booth. Setelah ditambahkan, muat
          ulang halaman ini.
        </p>
      </PanelHifi>
    )
  }

  async function call<T>(body: Record<string, unknown>): Promise<T> {
    let res: Awaited<ReturnType<typeof postWithAuth<T>>>
    try {
      res = await postWithAuth<T>("/api/booth-points/scan", body)
    } catch {
      throw new ScanRequestError("Sinyal terputus. Coba lagi: poin tidak akan terhitung dua kali.", null, null, true)
    }
    if (res.needsAuth) throw new ScanRequestError("Sesi berakhir. Silakan login ulang.", null, null, false)
    if (!res.payload.success) {
      const data = res.payload.data as { given?: GivenOptions } | null
      throw new ScanRequestError(res.payload.error.message, res.payload.error.code, data?.given ?? null, false)
    }
    return res.payload.data
  }

  async function lookup(qrCode: string, forBoothId: string) {
    setPhase({ kind: "busy", label: "Mencari pengunjung…" })
    setLastAward(null)
    try {
      const result = await call<Lookup>({ qrCode, boothId: forBoothId })
      setScanned({ qrCode, visitor: result.visitor, given: result.given, boothId: forBoothId })
      setPhase({ kind: "idle" })
    } catch (err) {
      setScanned(null)
      setPhase({ kind: "error", message: err instanceof Error ? err.message : "Gagal membaca QR." })
    }
  }

  function handleBoothChange(nextBoothId: string) {
    setBoothId(nextBoothId)
    // What the visitor has differs per booth: ask the server again for the new booth.
    if (scanned) void lookup(scanned.qrCode, nextBoothId)
  }

  async function handleGive(option: BoothPointOption) {
    if (!scanned || !booth) return
    const key = `${scanned.visitor.key}:${booth.id}:${option}`
    const clientRef = pendingRefs.current.get(key) ?? newClientRef()
    pendingRefs.current.set(key, clientRef)

    setPhase({ kind: "busy", label: "Mengirim ke server…" })
    try {
      const award = await call<Award>({ qrCode: scanned.qrCode, boothId: booth.id, option, clientRef })
      pendingRefs.current.delete(key)
      setScanned({ ...scanned, given: award.given, boothId: booth.id })
      setLastAward(award)
      if (!award.duplicate) setHistory((prev) => [award, ...prev].slice(0, 30))
      setPhase({ kind: "idle" })
      navigator.vibrate?.(60)
    } catch (err) {
      if (err instanceof ScanRequestError) {
        // A definite answer from the server ends this attempt; a network error keeps the ref for the retry.
        if (!err.network) pendingRefs.current.delete(key)
        if (err.given) setScanned({ ...scanned, given: err.given, boothId: booth.id })
      }
      setPhase({ kind: "error", message: err instanceof Error ? err.message : "Gagal mengirim poin." })
    }
  }

  function startScan() {
    setScanned(null)
    setLastAward(null)
    setPhase({ kind: "scanning" })
  }

  const contributionPoints = booth?.contribution ?? 0
  const bonusPoints = booth?.bonus ?? 0
  const options: Array<{ option: BoothPointOption; title: string; detail: string; icon: typeof Gift }> = [
    {
      option: "contribution",
      title: "Contribution",
      detail: `+${contributionPoints} poin, untuk pengunjung yang aktif di booth`,
      icon: Sparkles,
    },
  ]
  if (bonusPoints > 0) {
    options.push({
      option: "bonus",
      title: "Bonus",
      detail:
        given.contribution || given.bonus
          ? `+${bonusPoints} poin tambahan`
          : `+${bonusPoints} poin tambahan, sekaligus Contribution (+${contributionPoints})`,
      icon: Gift,
    })
  }

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
              <QrCameraScanner
                onResult={(qrCode) => void lookup(qrCode, boothId)}
                onError={(message) => setPhase({ kind: "error", message })}
              />
              <button type="button" className={styles.secondaryBtn} onClick={() => setPhase({ kind: "idle" })}>
                <X size={18} aria-hidden="true" /> Tutup kamera
              </button>
            </>
          ) : scanned ? (
            <div className={styles.visitor}>
              <p className={styles.visitorLabel}>Pengunjung</p>
              <p className={styles.visitorName}>{scanned.visitor.fullName}</p>
              {scanned.visitor.institution ? <p className={styles.muted}>{scanned.visitor.institution}</p> : null}
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
                onChange={(e) => handleBoothChange(e.target.value)}
                disabled={busy}
              >
                {boothGroups.map((group) => (
                  <optgroup key={group.category} label={group.label}>
                    {group.booths.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </optgroup>
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
              const plan = booth ? planBoothAward(given, option, booth) : null
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
                  <CheckCircle2 size={22} aria-hidden="true" />{" "}
                  {lastAward.duplicate ? "Sudah tercatat sebelumnya" : "Poin tercatat"}
                </p>
                <p>
                  {lastAward.duplicate ? "Tidak ada poin tambahan" : formatPlan(lastAward.plan)} untuk{" "}
                  {lastAward.visitor.fullName} · {lastAward.booth.name}
                </p>
                <p className={styles.muted}>
                  Diterima {timeFormat.format(new Date(lastAward.receivedAt))}
                  {lastAward.reference ? ` · ref ${lastAward.reference}` : ""}
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
        <PanelHifi title="Riwayat sesi ini" subtitle="Poin yang sudah tercatat di server, terbaru di atas.">
          {history.length === 0 ? (
            <p className={styles.muted}>Belum ada.</p>
          ) : (
            <ul className={styles.log}>
              {history.map((entry) => (
                <li key={`${entry.reference}-${entry.receivedAt}`} className={styles.logRow}>
                  <span className={styles.logName}>{entry.visitor.fullName}</span>
                  <span className={styles.logOutcome}>{formatPlan(entry.plan)}</span>
                  <span className={styles.muted}>
                    {entry.booth.name} · {timeFormat.format(new Date(entry.receivedAt))}
                    {entry.reference ? ` · ref ${entry.reference}` : ""}
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
