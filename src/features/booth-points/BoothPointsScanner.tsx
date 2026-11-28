"use client"

import { Camera, CheckCircle2, CloudOff, Gift, ScanLine, Sparkles, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import PanelHifi from "@/features/admin-hifi/PanelHifi"
import { dedupeKey, qrTail, type QueueEntry } from "@/features/offline-queue/queue"
import QueueStatus from "@/features/offline-queue/QueueStatus"
import { sendScan } from "@/features/offline-queue/send"
import { useOfflineQueue } from "@/features/offline-queue/useOfflineQueue"
import { warmPages } from "@/shared/components/Pwa/swClient"
import {
  groupBoothsByCategory,
  markGiven,
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
  server. Each award attempt carries a clientRef, written once by the database.

  No signal (docs/OFFLINE.md): an award that can't reach the server is stored on the phone with its
  clientRef and capture time (src/features/offline-queue) and sent automatically when the signal is
  back. If even the lookup can't reach the server, the visitor shows as "QR …abcd" and the award is
  queued straight away; the server decides on it when it arrives (refusals are listed for staff).
*/

type Visitor = { key: string; fullName: string; institution: string | null }

type Lookup = { booth: PointsBooth; visitor: Visitor; given: GivenOptions }
type Award = Lookup & { plan: AwardPlan; receivedAt: string; reference: string; duplicate: boolean }
type HistoryEntry = Award & { fromQueue: boolean }

/** visitor null: scanned without signal, the server has not said who it is. */
type Scanned = { qrCode: string; visitor: Visitor | null; given: GivenOptions; boothId: string }
type Queued = { label: string }

const OPTION_TITLE: Record<BoothPointOption, string> = { contribution: "Visited", bonus: "Bonus" }

type Phase =
  | { kind: "idle" }
  | { kind: "scanning" }
  | { kind: "busy"; label: string }
  | { kind: "error"; message: string }

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

/** What this phone has queued for the visitor at the booth counts as given (no double queueing). */
function withQueued(given: GivenOptions, pending: readonly QueueEntry[], qrCode: string, boothId: string): GivenOptions {
  let result = given
  for (const option of ["contribution", "bonus"] as const) {
    if (pending.some((entry) => entry.dedupeKey === dedupeKey("booth", qrCode, boothId, option))) {
      result = markGiven(result, option)
    }
  }
  return result
}

export default function BoothPointsScanner({
  booths,
  practice,
  staffUserId,
}: {
  booths: PointsBooth[]
  practice: boolean
  staffUserId: string
}) {
  const boothGroups = groupBoothsByCategory(booths)
  const [boothId, setBoothId] = useState(boothGroups[0]?.booths[0]?.id ?? "")
  const [phase, setPhase] = useState<Phase>({ kind: "idle" })
  const [scanned, setScanned] = useState<Scanned | null>(null)
  const [lastAward, setLastAward] = useState<Award | null>(null)
  const [lastQueued, setLastQueued] = useState<Queued | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])

  // A queued award that reached the server joins the session history.
  const onSent = useCallback((entry: QueueEntry, data: unknown) => {
    if (entry.kind !== "booth" || !data) return
    setHistory((prev) => [{ ...(data as Award), fromQueue: true }, ...prev].slice(0, 30))
  }, [])
  const queue = useOfflineQueue(staffUserId, { onSent })

  // Keep this scanner (and the map) usable offline: cache the page and its scripts.
  useEffect(() => warmPages(["/admin/booth", "/event-map"]), [])

  const booth = booths.find((b) => b.id === boothId) ?? null
  const given =
    scanned && scanned.boothId === boothId
      ? withQueued(scanned.given, queue.pending, scanned.qrCode, boothId)
      : NOTHING_GIVEN
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

  async function lookup(qrCode: string, forBoothId: string) {
    setPhase({ kind: "busy", label: "Mencari pengunjung…" })
    setLastAward(null)
    setLastQueued(null)
    const sent = await sendScan<Lookup>("booth", { qrCode, boothId: forBoothId })
    if (
      sent.result.type === "network" ||
      // A session refresh that failed on a weak signal looks the same; if the session really
      // ended, the queue panel says so when it tries to send.
      sent.result.type === "auth" ||
      (sent.result.type === "response" && sent.result.status >= 500)
    ) {
      // No signal: carry on without the name; the award is queued and checked by the server later.
      setScanned({ qrCode, visitor: null, given: NOTHING_GIVEN, boothId: forBoothId })
      setPhase({ kind: "idle" })
      return
    }
    if (!sent.payload) return
    if (!sent.payload.success) {
      setScanned(null)
      setPhase({ kind: "error", message: sent.payload.error.message })
      return
    }
    const result = sent.payload.data
    setScanned({ qrCode, visitor: result.visitor, given: result.given, boothId: forBoothId })
    setPhase({ kind: "idle" })
  }

  function visitorLabel(target: Scanned): string {
    return target.visitor?.fullName ?? `QR …${qrTail(target.qrCode)}`
  }

  async function queueAward(target: Scanned, forBooth: PointsBooth, option: BoothPointOption, clientRef: string) {
    const label = `${visitorLabel(target)} · ${OPTION_TITLE[option]} · ${forBooth.name}`
    await queue.enqueue({
      kind: "booth",
      id: clientRef,
      dedupeKey: dedupeKey("booth", target.qrCode, forBooth.id, option),
      label,
      body: { qrCode: target.qrCode, boothId: forBooth.id, option, clientRef },
    })
    setLastQueued({ label })
    setPhase({ kind: "idle" })
    navigator.vibrate?.([40, 60, 40])
  }

  function handleBoothChange(nextBoothId: string) {
    setBoothId(nextBoothId)
    // What the visitor has differs per booth: ask the server again for the new booth.
    if (scanned) void lookup(scanned.qrCode, nextBoothId)
  }

  async function handleGive(option: BoothPointOption) {
    if (!scanned || !booth) return
    const clientRef = newClientRef()
    setLastAward(null)
    setLastQueued(null)

    // Scanned without signal: straight to the queue.
    if (!scanned.visitor) {
      await queueAward(scanned, booth, option, clientRef)
      return
    }

    setPhase({ kind: "busy", label: "Mengirim ke server…" })
    const sent = await sendScan<Award>("booth", { qrCode: scanned.qrCode, boothId: booth.id, option, clientRef })
    const result = sent.result
    if (result.type === "network" || result.type === "auth" || (result.type === "response" && result.status >= 500)) {
      // It may or may not have arrived: queue it with the same clientRef, the database writes it once.
      await queueAward(scanned, booth, option, clientRef)
      return
    }
    if (!sent.payload) return
    if (!sent.payload.success) {
      const data = sent.payload.data as { given?: GivenOptions } | null
      if (data?.given) setScanned({ ...scanned, given: data.given, boothId: booth.id })
      setPhase({ kind: "error", message: sent.payload.error.message })
      return
    }
    const award = sent.payload.data
    setScanned({ ...scanned, given: award.given, boothId: booth.id })
    setLastAward(award)
    if (!award.duplicate) setHistory((prev) => [{ ...award, fromQueue: false }, ...prev].slice(0, 30))
    setPhase({ kind: "idle" })
    navigator.vibrate?.(60)
  }

  function startScan() {
    setScanned(null)
    setLastAward(null)
    setLastQueued(null)
    setPhase({ kind: "scanning" })
  }

  const contributionPoints = booth?.contribution ?? 0
  const bonusPoints = booth?.bonus ?? 0
  const options: Array<{ option: BoothPointOption; title: string; detail: string; icon: typeof Gift }> = [
    {
      option: "contribution",
      title: "Visited",
      detail: `+${contributionPoints} poin untuk pengunjung yang datang ke booth `,
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
          : `+${bonusPoints} poin tambahan untuk pengunjung yang aktif di booth, sekaligus Visited (+${contributionPoints})`,
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
              <p className={styles.visitorName}>{visitorLabel(scanned)}</p>
              {scanned.visitor?.institution ? <p className={styles.muted}>{scanned.visitor.institution}</p> : null}
              {!scanned.visitor ? (
                <p className={styles.muted}>
                  <CloudOff size={16} aria-hidden="true" /> Tanpa sinyal: nama muncul setelah terkirim. Poin disimpan
                  di HP dan dicek server saat sinyal kembali.
                </p>
              ) : null}
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
              ? `Untuk ${visitorLabel(scanned)} di ${booth?.name ?? "booth"}. Masing-masing sekali per pengunjung per booth.`
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

            {lastQueued && phase.kind === "idle" ? (
              <div className={`${styles.result} ${styles.resultQueued}`}>
                <p className={styles.resultTitle}>
                  <CloudOff size={22} aria-hidden="true" /> Tersimpan di HP
                </p>
                <p>{lastQueued.label}</p>
                <p className={styles.muted}>Dikirim otomatis saat sinyal kembali. Poin tidak akan terhitung dua kali.</p>
                <button type="button" className={styles.primaryBtn} onClick={startScan}>
                  <ScanLine size={20} aria-hidden="true" /> Scan pengunjung berikutnya
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
        <QueueStatus queue={queue} />

        <PanelHifi title="Riwayat sesi ini" subtitle="Poin yang sudah tercatat di server, terbaru di atas.">
          {history.length === 0 ? (
            <p className={styles.muted}>Belum ada.</p>
          ) : (
            <ul className={styles.log}>
              {history.map((entry) => (
                <li key={`${entry.reference}-${entry.receivedAt}`} className={styles.logRow}>
                  <span className={styles.logName}>{entry.visitor.fullName}</span>
                  <span className={styles.logOutcome}>
                    {entry.duplicate ? "Sudah tercatat" : formatPlan(entry.plan)}
                  </span>
                  <span className={styles.muted}>
                    {entry.booth.name} · {timeFormat.format(new Date(entry.receivedAt))}
                    {entry.reference ? ` · ref ${entry.reference}` : ""}
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
