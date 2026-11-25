import Link from "next/link"
import { House } from "lucide-react"

import QuestBottomNav from "./QuestBottomNav"
import styles from "./PointsHistoryMobile.module.css"

/**
 * Status satu catatan poin.
 *
 * Nama layer di dump masih sisa komponen lain ("Mengundurkan diri",
 * "Terdaftar", "Kadaluwarsa", "Menunggu pembayaran") — yang dipakai di sini
 * tulisan yang benar-benar tampil: Pending, Redeemed, Verified, Under Review,
 * Voided, Manual Grant.
 */
export type HistoryStatus =
  | "pending"
  | "redeemed"
  | "verified"
  | "review"
  | "voided"
  | "manual"

const LENCANA: Record<HistoryStatus, { label: string; kelas: string }> = {
  pending: { label: "Pending", kelas: "lencanaPending" },
  redeemed: { label: "Redeemed", kelas: "lencanaRedeemed" },
  verified: { label: "Verified", kelas: "lencanaVerified" },
  review: { label: "Under Review", kelas: "lencanaReview" },
  voided: { label: "Voided", kelas: "lencanaVoided" },
  manual: { label: "Manual Grant", kelas: "lencanaManual" },
}

export interface HistoryEntry {
  /** Jam saja, mis. "13:42". */
  time: string
  name: string
  /** Baris kedua: tempat penukaran dan keterangan. */
  detail: string
  status: HistoryStatus
  /** Sudah berformat lengkap dengan tandanya: "+80", "-100", "0". */
  amount: string
  /** Asal poin: "W+L", "Wallet", atau "-" kalau tidak ada. */
  source: string
}

export interface HistoryFilter {
  label: string
  active?: boolean
}

interface PointsHistoryMobileProps {
  filters: HistoryFilter[]
  entries: HistoryEntry[]
  /** Kode rujukan untuk dibawa ke help desk. */
  reference: string
  referenceNote: string
}

/**
 * Points History — Figma node 2124:21846, kanvas 402 x 1018.
 *
 * Dicapai dari ikon jam di header halaman Rewards, jadi tab yang menyala di
 * navigasi bawah tetap Rewards.
 */
export default function PointsHistoryMobile({
  filters,
  entries,
  reference,
  referenceNote,
}: PointsHistoryMobileProps) {
  return (
    <div className={styles.page}>
      <div className={styles.isi}>
        <header className={styles.header}>
          <Link href="/" className={styles.headerIcon} aria-label="Ke beranda">
            <House size={24} strokeWidth={1.5} aria-hidden />
          </Link>
          <h1 className={styles.judul}>POINTS HISTORY</h1>
          <span className={styles.headerSpacer} aria-hidden />
        </header>

        <div className={styles.saringan} role="group" aria-label="Saring riwayat">
          {filters.map((f) => (
            <button
              key={f.label}
              type="button"
              className={`${styles.chip} ${f.active ? styles.chipAktif : ""}`}
              aria-pressed={Boolean(f.active)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <ol className={styles.daftar}>
          {entries.map((e, i) => {
            const lencana = LENCANA[e.status]
            return (
              /* Jam + nama bisa berulang persis, jadi kuncinya indeks. */
              <li key={i} className={styles.kartu}>
                <p className={styles.jam}>{e.time}</p>

                <div className={styles.kartuTeks}>
                  <p className={styles.kartuNama}>{e.name}</p>
                  <p className={styles.kartuDetail}>{e.detail}</p>
                  <span className={`${styles.lencana} ${styles[lencana.kelas]}`}>
                    {lencana.label}
                  </span>
                </div>

                <div className={styles.kartuJumlah}>
                  <p className={styles.jumlah}>{e.amount}</p>
                  <p className={styles.sumber}>{e.source}</p>
                </div>
              </li>
            )
          })}
        </ol>

        <section className={styles.bantuan} aria-label="Poin tidak masuk">
          <h2 className={styles.bantuanJudul}>Points Missing?</h2>
          <p className={styles.bantuanNote}>{referenceNote}</p>
          <div className={styles.refBaris}>
            <div className={styles.refKotak}>
              <p className={styles.ref}>{reference}</p>
            </div>
            <button type="button" className={styles.lapor}>
              Report
            </button>
          </div>
        </section>
      </div>

      <QuestBottomNav active="rewards" scanHref="/quest/scan" />
    </div>
  )
}
