import Link from "next/link"
import { Check, Clock, House, Lock } from "lucide-react"

import QuestBottomNav from "./QuestBottomNav"
import styles from "./RewardsMobile.module.css"

/** Tier: sudah terbuka, tier berikutnya yang dikejar, atau masih jauh. */
export type TierState = "unlocked" | "next" | "locked"

export interface TierEntry {
  state: TierState
  /** "Unlocked" atau "252 to unlock". */
  status: string
  name: string
  points: string
  /** Boleh dua baris — pakai "\n". Lebih dari itu dipotong. */
  perk: string
}

/**
 * - `beli`    — poin cukup, tombol menyala
 * - `habis`   — stok nol; barisnya ikut dipudarkan
 * - `kurang`  — poin tidak cukup, tombol cuma bergaris
 */
export type RewardState = "beli" | "habis" | "kurang"

export interface RewardEntry {
  /** Label di kotak gambar, mis. "MERCH" / "SPON". Gambarnya belum ada. */
  badge: string
  /** Hijau untuk hadiah sponsor, ungu untuk merch. */
  sponsor?: boolean
  name: string
  /** Baris kedua: tempat ambil dan sisa stok. */
  sub: string
  state: RewardState
  /** Tulisan di tombol: "300 pts", "Sold Out", "Need 260". */
  action: string
}

interface RewardsMobileProps {
  wallet: { spend: string; lifetime: string }
  /** Hadiah yang sudah ditukar dan tinggal diambil. Tanpa ini kartunya hilang. */
  claim?: { status: string; name: string; note: string; action: string }
  tiers: TierEntry[]
  rewards: RewardEntry[]
  youAre?: { rank: string; title: string; note: string }
  /** Tujuan ikon jam di header. Tanpa ini tombolnya tetap ada tapi mati. */
  historyHref?: string
}

/**
 * Rewards Mobile — Figma node 2114:21381, kanvas 402 x 1120.
 *
 * Seperti LeaderboardMobile, halaman ini memakai navigasi bawah quest sendiri
 * dan BUKAN NavbarHifi.
 */
export default function RewardsMobile({
  wallet,
  claim,
  tiers,
  rewards,
  youAre,
  historyHref,
}: RewardsMobileProps) {
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
            <button type="button" className={styles.headerIcon} aria-label="Riwayat poin">
              <Clock size={24} strokeWidth={1.5} aria-hidden />
            </button>
          )}
        </header>

        <section className={styles.dompet} aria-label="Dompet poin">
          <div className={styles.dompetKolom}>
            <p className={styles.dompetLabel}>WALLET . SPEND</p>
            <p className={styles.dompetAngka}>{wallet.spend}</p>
          </div>
          <div className={styles.dompetKolom}>
            <p className={styles.dompetLabel}>LIFETIME . RANK</p>
            <p className={styles.dompetAngka}>{wallet.lifetime}</p>
          </div>
        </section>

        {claim ? (
          <section className={styles.klaim} aria-label="Siap diambil">
            <div className={styles.klaimTeks}>
              <p className={styles.klaimStatus}>{claim.status}</p>
              <p className={styles.klaimNama}>{claim.name}</p>
              <p className={styles.klaimNote}>{claim.note}</p>
            </div>
            <button type="button" className={styles.klaimAksi}>
              {claim.action}
            </button>
          </section>
        ) : null}

        <section className={styles.tier}>
          <h2 className={styles.judulBagian}>TIERS . BY LIFETIME POINTS</h2>

          {/*
            Dua lapis: kartu tier, dan deret lingkaran status yang menumpang di
            garis atasnya. Keduanya grid 3 kolom yang sama persis, jadi tiap
            lingkaran otomatis jatuh di tengah kartunya — tanpa menghitung
            offset satu per satu.
          */}
          <div className={styles.tierBlok}>
            <ol className={styles.tierKartu}>
              {tiers.map((t) => (
                <li
                  key={t.name}
                  className={[
                    styles.kartuTier,
                    t.state === "unlocked" ? styles.kartuTierBuka : "",
                    t.state === "next" ? styles.kartuTierBerikut : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className={styles.tierGrup}>
                    <span className={styles.tierStatus}>{t.status}</span>
                    <span className={styles.tierNama}>{t.name}</span>
                  </div>
                  <div className={styles.tierGrup}>
                    <span className={styles.tierPoin}>{t.points}</span>
                    <span className={styles.tierPerk}>{t.perk}</span>
                  </div>
                </li>
              ))}
            </ol>

            <div className={styles.tierBulatan} aria-hidden>
              {tiers.map((t) => (
                <span
                  key={t.name}
                  className={`${styles.bulat} ${t.state === "unlocked" ? styles.bulatBuka : ""}`}
                >
                  {t.state === "unlocked" ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    <Lock size={13} strokeWidth={2} />
                  )}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.belanja}>
          <h2 className={styles.judulBagian}>SPEND WALLET POINTS</h2>
          <ul className={styles.belanjaDaftar}>
            {rewards.map((r) => (
              <li
                key={r.name}
                className={`${styles.item} ${r.state === "habis" ? styles.itemHabis : ""}`}
              >
                {/* Kotak gambar hadiah. Gambarnya belum ada, jadi baru labelnya. */}
                <span className={`${styles.thumb} ${r.sponsor ? styles.thumbSponsor : ""}`}>
                  {r.badge}
                </span>
                <div className={styles.itemTeks}>
                  <p className={styles.itemNama}>{r.name}</p>
                  <p className={styles.itemSub}>{r.sub}</p>
                </div>
                <button
                  type="button"
                  className={[
                    styles.tombol,
                    r.state === "habis" ? styles.tombolHabis : "",
                    r.state === "kurang" ? styles.tombolKurang : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  disabled={r.state !== "beli"}
                >
                  {r.action}
                </button>
              </li>
            ))}
          </ul>
        </section>

        {youAre ? (
          <section className={styles.kamu} aria-label="Peringkat kamu">
            <div className={styles.kamuPeringkat}>
              <p className={styles.kamuLabel}>You Are</p>
              <p className={styles.kamuAngka}>{youAre.rank}</p>
            </div>
            <div className={styles.kamuTeks}>
              <p className={styles.kamuJudul}>{youAre.title}</p>
              <p className={styles.kamuNote}>{youAre.note}</p>
            </div>
          </section>
        ) : null}
      </div>

      <QuestBottomNav active="rewards" scanHref="/quest/scan" />
    </div>
  )
}
