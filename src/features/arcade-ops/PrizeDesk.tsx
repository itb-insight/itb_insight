"use client"

import { Camera, CheckCircle2, Gift, ScanLine, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"

import PanelHifi from "@/features/admin-hifi/PanelHifi"
import scanner from "@/features/booth-points/BoothPointsScanner.module.css"
import { postWithAuth } from "@/features/dashboard/apiClient"
import QrCameraScanner from "@/shared/components/QrCameraScanner/QrCameraScanner"

import styles from "./PrizeDesk.module.css"

/*
  Insight Arcade prize desk (/admin/prizes), like the booth scanner's booth switch:
    1. Pick the prize this desk is handing out (Sticker, Mug or Keychain).
    2. Scan a visitor's profile QR: the picked prize is handed over at once. The server
       (arcade_claim_prize) checks eligibility, stock and one per prize per person.
  Stock: the number left goes down with every handout; staff add or remove stock, or set the
  number left after counting, through POST /api/arcade/prize/stock (arcade_adjust_prize_stock).
*/

export type PrizeTier = { tier: number; name: string; claimed: number; left: number | null }
export type DeskWinner = { rank: number; name: string; prize: string; claimed: boolean }

type Handout = { name: string; prize: string; at: string }
type HandResult = { visitor: { name: string }; handed: string | null; left: number | null }

type Phase =
  | { kind: "idle" }
  | { kind: "scanning" }
  | { kind: "busy" }
  | { kind: "done"; handout: Handout; left: number | null }
  | { kind: "error"; message: string }

const timeFormat = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
const REFRESH_MS = 30_000

function leftLabel(left: number | null): string {
  return left === null ? "stok tidak dibatasi" : left === 0 ? "stok habis" : `sisa ${left}`
}

export default function PrizeDesk({ tiers, winners }: { tiers: PrizeTier[]; winners: DeskWinner[] }) {
  const router = useRouter()
  const [, startRefresh] = useTransition()
  const [tierNumber, setTierNumber] = useState(tiers[0]?.tier ?? 101)
  const [phase, setPhase] = useState<Phase>({ kind: "idle" })
  const [history, setHistory] = useState<Handout[]>([])

  const prize = tiers.find((t) => t.tier === tierNumber) ?? null
  const busy = phase.kind === "busy"

  // Another desk may hand out or restock at the same time: keep the stock fresh.
  useEffect(() => {
    const timer = setInterval(() => startRefresh(() => router.refresh()), REFRESH_MS)
    return () => clearInterval(timer)
  }, [router])

  async function handOver(qrCode: string) {
    if (!prize) return
    setPhase({ kind: "busy" })
    const res = await postWithAuth<HandResult>("/api/arcade/prize", { qrCode, tier: String(prize.tier) }).catch(() => null)
    if (!res) return setPhase({ kind: "error", message: "Sinyal terputus. Scan lagi: hadiah tidak tercatat dua kali." })
    if (res.needsAuth) return setPhase({ kind: "error", message: "Sesi berakhir. Silakan login ulang." })
    if (!res.payload.success) return setPhase({ kind: "error", message: res.payload.error.message })

    const handout = { name: res.payload.data.visitor.name, prize: prize.name, at: new Date().toISOString() }
    setHistory((prev) => [handout, ...prev].slice(0, 30))
    setPhase({ kind: "done", handout, left: res.payload.data.left })
    navigator.vibrate?.(60)
    startRefresh(() => router.refresh())
  }

  if (tiers.length === 0) {
    return (
      <PanelHifi title="Belum ada hadiah" subtitle="Hadiah Insight Arcade (reward_tiers 101-103) belum aktif.">
        <p className={scanner.muted}>Jalankan migrasi 0032 lalu muat ulang halaman ini.</p>
      </PanelHifi>
    )
  }

  return (
    <div className={scanner.layout}>
      <div className={scanner.column}>
        <PanelHifi title="1. Hadiah yang dibagikan" subtitle="Pilih dulu, lalu setiap scan langsung menyerahkan hadiah ini.">
          <div className={styles.prizes} role="radiogroup" aria-label="Hadiah yang dibagikan">
            {tiers.map((t) => (
              <button
                key={t.tier}
                type="button"
                role="radio"
                aria-checked={t.tier === tierNumber}
                className={`${styles.prize} ${t.tier === tierNumber ? styles.prizeOn : ""}`}
                onClick={() => {
                  setTierNumber(t.tier)
                  if (phase.kind !== "scanning") setPhase({ kind: "idle" })
                }}
                disabled={busy}
              >
                <Gift size={22} aria-hidden="true" />
                <span className={styles.prizeName}>{t.name}</span>
                <span className={styles.prizeLeft}>{leftLabel(t.left)}</span>
              </button>
            ))}
          </div>
        </PanelHifi>

        <PanelHifi
          title={`2. Scan QR · ${prize?.name ?? "hadiah"}`}
          subtitle="QR ada di Insight Arcade → tab Scan, atau Dashboard → Profil. Satu hadiah per jenis per orang."
        >
          {phase.kind === "scanning" ? (
            <>
              <QrCameraScanner
                onResult={(code) => void handOver(code)}
                onError={(message) => setPhase({ kind: "error", message })}
              />
              <button type="button" className={scanner.secondaryBtn} onClick={() => setPhase({ kind: "idle" })}>
                <X size={18} aria-hidden="true" /> Tutup kamera
              </button>
            </>
          ) : phase.kind === "idle" ? (
            <button
              type="button"
              className={scanner.primaryBtn}
              onClick={() => setPhase({ kind: "scanning" })}
              disabled={prize?.left === 0}
            >
              <Camera size={22} aria-hidden="true" /> {prize?.left === 0 ? "Stok habis" : "Buka kamera & scan"}
            </button>
          ) : null}

          <div aria-live="polite">
            {busy ? <p className={scanner.status}>Mencatat hadiah…</p> : null}

            {phase.kind === "done" ? (
              <div className={`${scanner.result} ${scanner.resultOk}`}>
                <p className={scanner.resultTitle}>
                  <CheckCircle2 size={22} aria-hidden="true" /> Serahkan {phase.handout.prize}
                </p>
                <p>
                  Untuk {phase.handout.name} · {leftLabel(phase.left)}
                </p>
                <button type="button" className={scanner.primaryBtn} onClick={() => setPhase({ kind: "scanning" })}>
                  <ScanLine size={20} aria-hidden="true" /> Scan pengunjung berikutnya
                </button>
              </div>
            ) : null}

            {phase.kind === "error" ? (
              <div className={`${scanner.result} ${scanner.resultError}`}>
                <p className={scanner.resultTitle}>Jangan serahkan hadiah</p>
                <p>{phase.message}</p>
                <button type="button" className={scanner.secondaryBtn} onClick={() => setPhase({ kind: "scanning" })}>
                  <ScanLine size={18} aria-hidden="true" /> Scan lagi
                </button>
              </div>
            ) : null}
          </div>
        </PanelHifi>
      </div>

      <div className={scanner.column}>
        <PanelHifi title="Stok" subtitle="Turun sendiri tiap hadiah diserahkan. Tambah saat stok baru datang, atau atur sisanya setelah dihitung.">
          <div className={styles.stockList}>
            {tiers.map((t) => (
              <StockRow key={t.tier} tier={t} onChanged={() => startRefresh(() => router.refresh())} />
            ))}
          </div>
        </PanelHifi>

        <PanelHifi title="Riwayat sesi ini" subtitle="Hadiah yang tercatat dari perangkat ini, terbaru di atas.">
          {history.length === 0 ? (
            <p className={scanner.muted}>Belum ada.</p>
          ) : (
            <ul className={scanner.log}>
              {history.map((h) => (
                <li key={h.at} className={scanner.logRow}>
                  <span className={scanner.logName}>{h.name}</span>
                  <span className={scanner.logOutcome}>{h.prize}</span>
                  <span className={scanner.muted}>{timeFormat.format(new Date(h.at))}</span>
                </li>
              ))}
            </ul>
          )}
        </PanelHifi>

        <PanelHifi title="Pemenang Mug & Keychain" subtitle={winners.length ? "Dari hasil akhir yang diumumkan." : "Hasil akhir belum diumumkan."}>
          <ul className={scanner.log}>
            {winners.map((w) => (
              <li key={w.rank} className={scanner.logRow}>
                <span className={scanner.logName}>
                  #{w.rank} {w.name}
                </span>
                <span className={scanner.muted}>
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

const STEPS = [-10, -1, 1, 10]

function StockRow({ tier, onChanged }: { tier: PrizeTier; onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const [setTo, setSetTo] = useState("")
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function adjust(body: { delta: number } | { left: number }) {
    setBusy(true)
    setMessage(null)
    const res = await postWithAuth<{ left: number }>("/api/arcade/prize/stock", { tier: tier.tier, ...body }).catch(() => null)
    setBusy(false)
    if (!res || res.needsAuth) return setMessage({ ok: false, text: "Sinyal terputus atau sesi berakhir. Coba lagi." })
    if (!res.payload.success) return setMessage({ ok: false, text: res.payload.error.message })
    setMessage({ ok: true, text: `Sisa sekarang ${res.payload.data.left}.` })
    setSetTo("")
    onChanged()
  }

  const parsed = /^\d{1,6}$/.test(setTo) ? Number(setTo) : null

  return (
    <div className={styles.stock}>
      <div className={styles.stockHead}>
        <span className={styles.stockName}>{tier.name}</span>
        <span className={styles.stockCount}>
          <strong>{tier.left ?? "∞"}</strong> sisa · {tier.claimed} diambil
        </span>
      </div>
      <div className={styles.stockSteps}>
        {STEPS.map((step) => (
          <button
            key={step}
            type="button"
            className={styles.stepBtn}
            disabled={busy || (step < 0 && (tier.left ?? 0) + step < 0)}
            onClick={() => void adjust({ delta: step })}
            aria-label={`${step > 0 ? "Tambah" : "Kurangi"} ${Math.abs(step)} ${tier.name}`}
          >
            {step > 0 ? `+${step}` : `−${Math.abs(step)}`}
          </button>
        ))}
      </div>
      <form
        className={styles.stockSet}
        onSubmit={(e) => {
          e.preventDefault()
          if (parsed === null) return
          if (window.confirm(`Atur sisa ${tier.name} menjadi ${parsed}?`)) void adjust({ left: parsed })
        }}
      >
        <input
          className={styles.stockInput}
          inputMode="numeric"
          placeholder="Sisa setelah dihitung"
          aria-label={`Sisa ${tier.name} setelah dihitung`}
          value={setTo}
          onChange={(e) => setSetTo(e.target.value.trim())}
          disabled={busy}
        />
        <button type="submit" className={styles.stepBtn} disabled={busy || parsed === null}>
          Atur
        </button>
      </form>
      {message ? <p className={message.ok ? styles.ok : styles.error}>{message.text}</p> : null}
    </div>
  )
}
