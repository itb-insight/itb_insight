import Link from "next/link"
import { Clock, House, MapPin } from "lucide-react"

import styles from "./RewardsMobile.module.css"

/**
 * - `ambil`    — boleh diambil sekarang, tombol menyala (ke QR profil)
 * - `diambil`  — sudah diterima
 * - `habis`    — stok nol; barisnya ikut dipudarkan
 * - `terkunci` — belum memenuhi syarat, tombol cuma bergaris
 */
export type RewardState = "ambil" | "diambil" | "habis" | "terkunci"

export interface RewardEntry {
  /** Label di kotak gambar, mis. "MERCH". Gambarnya belum ada. */
  badge: string
  name: string
  /** Baris kedua: syarat dan sisa stok. */
  sub: string
  state: RewardState
  /** Tulisan di tombol: "Ambil", "Diambil", "Habis", "Top 5". */
  action: string
  /** Tujuan tombol saat `ambil`. */
  href?: string
}

interface RewardsMobileProps {
  /** Poin tidak dibelanjakan: total poin dan peringkat saja. */
  summary: { points: string; rank: string }
  /** Hadiah yang siap diambil (atau ajakan login). Tanpa ini kartunya hilang. */
  claim?: { status: string; name: string; note: string; action: string; href: string }
  rewards: RewardEntry[]
  youAre?: { rank: string; title: string; note: string }
  /** Tempat ambil hadiah; href null = tanpa tautan (peta dimatikan). */
  where?: { label: string; href: string | null }
  /** Tujuan ikon jam di header (riwayat poin). Tanpa ini ikonnya tidak tampil. */
  historyHref?: string
}

/**
 * Rewards Mobile — Figma node 2114:21381, kanvas 402 x 1120.
 *
 * Insight Arcade tidak punya dompet: poin hanya untuk peringkat dan tidak pernah
 * dibelanjakan. Sticker diambil kapan saja setelah menyelesaikan satu quest;
 * Mug dan Keychain diambil setelah hasil akhir diumumkan.
 *
 * Seperti LeaderboardMobile, halaman ini memakai navigasi bawah quest sendiri
 * dan BUKAN NavbarHifi.
 */
export default function RewardsMobile({ summary, claim, rewards, youAre, where, historyHref }: RewardsMobileProps) {
  return (
    <div className={styles.page}>
      <div className={styles.isi}>
        <header className={styles.header}>
          <Link href="/" className={styles.headerIcon} aria-label="Ke beranda">
            <House size={24} strokeWidth={1.5} aria-hidden />
          </Link>
          <h1 className={styles.judul}>REWARDS</h1>
          {historyHref ? (
            <Link href={historyHref} className={styles.headerIcon} aria-label="Riwayat poin">
              <Clock size={24} strokeWidth={1.5} aria-hidden />
            </Link>
          ) : (
            <span className={styles.headerIcon} aria-hidden />
          )}
        </header>

        <section className={styles.dompet} aria-label="Poin dan peringkat">
          <div className={styles.dompetKolom}>
            <p className={styles.dompetLabel}>TOTAL POIN</p>
            <p className={styles.dompetAngka}>{summary.points}</p>
          </div>
          <div className={styles.dompetKolom}>
            <p className={styles.dompetLabel}>PERINGKAT</p>
            <p className={styles.dompetAngka}>{summary.rank}</p>
          </div>
        </section>

        {claim ? (
          <section className={styles.klaim} aria-label="Siap diambil">
            <div className={styles.klaimTeks}>
              <p className={styles.klaimStatus}>{claim.status}</p>
              <p className={styles.klaimNama}>{claim.name}</p>
              <p className={styles.klaimNote}>{claim.note}</p>
            </div>
            <Link href={claim.href} className={styles.klaimAksi}>
              {claim.action}
            </Link>
          </section>
        ) : null}

        <section className={styles.belanja}>
          <h2 className={styles.judulBagian}>HADIAH</h2>
          <ul className={styles.belanjaDaftar}>
            {rewards.map((r) => {
              const tombol = [
                styles.tombol,
                r.state === "habis" ? styles.tombolHabis : "",
                r.state === "terkunci" ? styles.tombolKurang : "",
                r.state === "diambil" ? styles.tombolSelesai : "",
              ]
                .filter(Boolean)
                .join(" ")
              return (
                <li key={r.name} className={`${styles.item} ${r.state === "habis" ? styles.itemHabis : ""}`}>
                  {/* Kotak gambar hadiah. Gambarnya belum ada, jadi baru labelnya. */}
                  <span className={styles.thumb}>{r.badge}</span>
                  <div className={styles.itemTeks}>
                    <p className={styles.itemNama}>{r.name}</p>
                    <p className={styles.itemSub}>{r.sub}</p>
                  </div>
                  {r.state === "ambil" && r.href ? (
                    <Link href={r.href} className={tombol}>
                      {r.action}
                    </Link>
                  ) : (
                    <span className={tombol}>{r.action}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        {where ? (
          where.href ? (
            <Link href={where.href} className={styles.lokasi}>
              <MapPin size={18} strokeWidth={2} aria-hidden />
              <span>{where.label}</span>
            </Link>
          ) : (
            <p className={styles.lokasi}>
              <MapPin size={18} strokeWidth={2} aria-hidden />
              <span>{where.label}</span>
            </p>
          )
        ) : null}

        {youAre ? (
          <section className={styles.kamu} aria-label="Peringkat kamu">
            <div className={styles.kamuPeringkat}>
              <p className={styles.kamuLabel}>Kamu</p>
              <p className={styles.kamuAngka}>{youAre.rank}</p>
            </div>
            <div className={styles.kamuTeks}>
              <p className={styles.kamuJudul}>{youAre.title}</p>
              <p className={styles.kamuNote}>{youAre.note}</p>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
