import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import type { HistoryState } from "@/lib/arcade"

import styles from "./PointsHistoryMobile.module.css"

/**
 * Status satu catatan poin (arcade_player_history, migration 0039). Insight
 * Arcade tidak punya dompet, jadi tidak ada "Redeemed": poin cuma naik atau turun.
 */
export type HistoryStatus = HistoryState

const LENCANA: Record<HistoryStatus, { label: string; kelas: string }> = {
  earned: { label: "Masuk", kelas: "lencanaVerified" },
  review: { label: "Dicek panitia", kelas: "lencanaReview" },
  pending: { label: "Menunggu", kelas: "lencanaPending" },
  voided: { label: "Dibatalkan", kelas: "lencanaVoided" },
  manual: { label: "Koreksi", kelas: "lencanaManual" },
}

export interface HistoryEntry {
  /** Jam saja (WIB), mis. "13:42". */
  time: string
  name: string
  /** Baris kedua: asal dan keterangan. */
  detail: string
  status: HistoryStatus
  /** Sudah berformat lengkap dengan tandanya: "+80", "-100", "0". */
  amount: string
  /** Asal poin: "Booth", "Quest", "Koleksi", "Panitia". */
  source: string
}

export interface HistoryFilter {
  label: string
  href: string
  active?: boolean
}

interface PointsHistoryMobileProps {
  filters: HistoryFilter[]
  entries: HistoryEntry[]
  /** Tulisan saat daftar (setelah disaring) kosong. */
  empty: string
  /** Kode rujukan untuk dibawa ke panitia. */
  reference: string
  referenceNote: string
  /** Tombol di kartu bantuan, mis. ke lokasi meja hadiah di peta. */
  help?: { label: string; href: string }
  backHref: string
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
  empty,
  reference,
  referenceNote,
  help,
  backHref,
}: PointsHistoryMobileProps) {
  return (
    <div className={styles.page}>
      <div className={styles.isi}>
        <header className={styles.header}>
          <Link href={backHref} className={styles.headerIcon} aria-label="Kembali ke Rewards">
            <ArrowLeft size={24} strokeWidth={1.5} aria-hidden />
          </Link>
          <h1 className={styles.judul}>RIWAYAT POIN</h1>
          <span className={styles.headerSpacer} aria-hidden />
        </header>

        <nav className={styles.saringan} aria-label="Saring riwayat">
          {filters.map((f) => (
            <Link
              key={f.label}
              href={f.href}
              replace
              scroll={false}
              className={`${styles.chip} ${f.active ? styles.chipAktif : ""}`}
              aria-current={f.active ? "page" : undefined}
            >
              {f.label}
            </Link>
          ))}
        </nav>

        {entries.length === 0 ? (
          <p className={styles.kosong}>{empty}</p>
        ) : (
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
                    <span className={`${styles.lencana} ${styles[lencana.kelas]}`}>{lencana.label}</span>
                  </div>

                  <div className={styles.kartuJumlah}>
                    <p className={styles.jumlah}>{e.amount}</p>
                    <p className={styles.sumber}>{e.source}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        )}

        <section className={styles.bantuan} aria-label="Poin tidak masuk">
          <h2 className={styles.bantuanJudul}>Poin belum masuk?</h2>
          <p className={styles.bantuanNote}>{referenceNote}</p>
          <div className={styles.refBaris}>
            <div className={styles.refKotak}>
              <p className={styles.ref}>{reference}</p>
            </div>
            {help ? (
              <Link href={help.href} className={styles.lapor}>
                {help.label}
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}
