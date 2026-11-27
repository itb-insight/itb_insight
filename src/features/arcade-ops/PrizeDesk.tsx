"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import PanelHifi from "@/features/admin-hifi/PanelHifi"
import styles from "@/features/booth-points/BoothAccessManager.module.css"
import { postWithAuth } from "@/features/dashboard/apiClient"
import QrCameraScanner from "@/shared/components/QrCameraScanner/QrCameraScanner"

/* Insight Arcade prize desk (/admin/prizes): scan the visitor's QR, hand over a prize. */

export type PrizeTier = { tier: string; name: string; stock: number | null; claimed: number }

type Lookup = { visitor: { name: string }; claimed: string[]; handed: string | null }

export type DeskWinner = { rank: number; name: string; prize: string; claimed: boolean }

export default function PrizeDesk({ tiers, winners }: { tiers: PrizeTier[]; winners: DeskWinner[] }) {
  const router = useRouter()
  const [, startRefresh] = useTransition()
  const [scanning, setScanning] = useState(false)
  const [qr, setQr] = useState<string | null>(null)
  const [lookup, setLookup] = useState<Lookup | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function call(body: Record<string, unknown>) {
    setBusy(true)
    setMessage(null)
    const res = await postWithAuth<Lookup>("/api/arcade/prize", body).catch(() => null)
    setBusy(false)
    if (!res || res.needsAuth) return setMessage({ ok: false, text: "Sinyal terputus atau sesi berakhir. Coba lagi." })
    if (!res.payload.success) return setMessage({ ok: false, text: res.payload.error.message })
    setLookup(res.payload.data)
    if (res.payload.data.handed) {
      setMessage({ ok: true, text: `Tercatat: ${tiers.find((t) => t.tier === res.payload.data?.handed)?.name ?? "hadiah"} diserahkan.` })
      startRefresh(() => router.refresh())
    }
  }

  return (
    <div className={styles.layout}>
      <div className={styles.column}>
        <PanelHifi title="Scan QR pengunjung" subtitle="QR ada di Insight Arcade → tab Scan, atau Dashboard → Profil.">
          {scanning ? (
            <QrCameraScanner
              onResult={(code) => {
                setScanning(false)
                setQr(code)
                void call({ qrCode: code })
              }}
              onError={(text) => setMessage({ ok: false, text })}
            />
          ) : (
            <button type="button" className={styles.primaryBtn} onClick={() => setScanning(true)} disabled={busy}>
              Buka kamera &amp; scan
            </button>
          )}
          {lookup && qr ? (
            <div className={styles.form}>
              <p className={styles.logName}>{lookup.visitor.name}</p>
              {tiers.map((t) => {
                const has = lookup.claimed.includes(t.tier)
                return (
                  <button
                    key={t.tier}
                    type="button"
                    className={styles.primaryBtn}
                    disabled={busy || has}
                    onClick={() => {
                      if (window.confirm(`Serahkan ${t.name} ke ${lookup.visitor.name}?`)) void call({ qrCode: qr, tier: t.tier })
                    }}
                  >
                    {has ? `${t.name}: sudah diambil` : `Serahkan ${t.name}`}
                  </button>
                )
              })}
            </div>
          ) : null}
          {message ? <p className={`${styles.status} ${message.ok ? styles.statusOk : styles.statusError}`}>{message.text}</p> : null}
        </PanelHifi>
      </div>
      <div className={styles.column}>
        <PanelHifi title="Stok" subtitle="Sticker: siapa saja yang sudah menyelesaikan quest. Mug 1–5, Keychain 6–10 setelah hasil diumumkan.">
          <ul className={styles.log}>
            {tiers.map((t) => (
              <li key={t.tier} className={styles.logRow}>
                <span className={styles.logName}>{t.name}</span>
                <span className={styles.logTag}>
                  {t.claimed} diambil{t.stock !== null ? ` · sisa ${Math.max(0, t.stock - t.claimed)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </PanelHifi>
        <PanelHifi title="Pemenang Mug & Keychain" subtitle={winners.length ? "Dari hasil akhir yang diumumkan." : "Hasil akhir belum diumumkan."}>
          <ul className={styles.log}>
            {winners.map((w) => (
              <li key={w.rank} className={styles.logRow}>
                <span className={styles.logName}>
                  #{w.rank} {w.name}
                </span>
                <span className={w.claimed ? styles.logAdded : styles.logTag}>
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
