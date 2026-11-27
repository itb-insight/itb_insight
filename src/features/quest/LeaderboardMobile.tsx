import type { CSSProperties } from "react"
import Link from "next/link"
import { House, Info } from "lucide-react"

import styles from "./LeaderboardMobile.module.css"

export interface PodiumEntry {
  /** Inisial di lingkaran avatar, mis. "BS". */
  initials: string
  name: string
  points: string
}

export interface LeaderboardEntry {
  rank: number
  name: string
  quests: number
  points: string
}

interface LeaderboardMobileProps {
  /** Hitung mundur sampai papan dibekukan, sudah diformat: "01:03:48". */
  countdown?: string
  freezeLabel?: string
  freezeNote?: string
  updatedLabel?: string
  /** Urut: juara 1, 2, 3. Tata letak podiumnya diurus di sini. */
  podium: [PodiumEntry, PodiumEntry, PodiumEntry]
  rows: LeaderboardEntry[]
  /**
   * Peringkat di sekitar posisimu. Kalau diisi, di antara dua daftar muncul
   * baris "..." — di dump itu pemisah antara peringkat 10 dan 36, bukan
   * penutup daftar.
   */
  nearby?: LeaderboardEntry[]
  /** Baris "You" di bawah daftar. */
  me?: {
    rank: number
    name: string
    note: string
    points: string
  }
}

/**
 * Leaderboard Mobile — Figma node 3429:17434, kanvas 402 x 998.
 *
 * Halaman ini membawa navigasi bawahnya sendiri (Quests / Map / Scan / Board /
 * Rewards) dan TIDAK memakai NavbarHifi — lihat catatan di QuestBottomNav.
 */
export default function LeaderboardMobile({
  countdown = "01:03:48",
  freezeLabel = "FREEZES ON 18:00",
  freezeNote = "Aim for Top 3 to win the door prize!",
  updatedLabel = "Updated 4 mins ago",
  podium,
  rows,
  nearby,
  me,
}: LeaderboardMobileProps) {
  const [juara1, juara2, juara3] = podium

  return (
    <div className={styles.page}>
      <div className={styles.isi}>
        <header className={styles.header}>
          <Link href="/" className={styles.headerIcon} aria-label="Ke beranda">
            <House size={24} strokeWidth={1.5} aria-hidden />
          </Link>
          {/* Dump menulis "LEADERBOAD" (kurang huruf R) — jelas salah ketik. */}
          <h1 className={styles.judul}>LEADERBOARD</h1>
          <button type="button" className={styles.headerIcon} aria-label="Cara kerja leaderboard">
            <Info size={24} strokeWidth={1.5} aria-hidden />
          </button>
        </header>

        <section className={styles.countdown} aria-label="Waktu pembekuan papan">
          <div className={styles.countdownTeks}>
            <p className={styles.freeze}>{freezeLabel}</p>
            <p className={styles.freezeNote}>{freezeNote}</p>
          </div>
          <p className={styles.jam}>{countdown}</p>
        </section>

        <div className={styles.utama}>
          <div className={styles.saringan}>
            <div className={styles.chips}>
              <button type="button" className={`${styles.chip} ${styles.chipAktif}`} aria-pressed>
                Individual
              </button>
              <button type="button" className={styles.chip} aria-pressed={false}>
                Faculty 2027
              </button>
            </div>
            <p className={styles.updated}>{updatedLabel}</p>
          </div>

          {/*
            Podium: tiga kolom 89px berjarak 8, dengan alas berbeda tinggi
            (juara 1 = 122, juara 2 = 98, juara 3 = 76) yang semuanya berakhir
            di garis yang sama. Jadi yang disejajarkan bagian BAWAHnya.
          */}
          <ol className={styles.podium}>
            <PodiumKolom entry={juara2} rank={2} tinggiAlas={98} />
            <PodiumKolom entry={juara1} rank={1} tinggiAlas={122} juara />
            <PodiumKolom entry={juara3} rank={3} tinggiAlas={76} />
          </ol>

          <ol className={styles.daftar}>
            {rows.map((r) => (
              <BarisPeringkat key={r.rank} entry={r} />
            ))}

            {nearby && nearby.length > 0 ? (
              <>
                <li className={`${styles.baris} ${styles.barisJeda}`} aria-hidden>
                  <span className={styles.peringkat}>...</span>
                </li>
                {nearby.map((r) => (
                  <BarisPeringkat key={r.rank} entry={r} />
                ))}
              </>
            ) : null}
          </ol>
        </div>

        {me ? (
          <section className={styles.kamu} aria-label="Peringkat kamu">
            <span className={styles.kamuAvatar}>#{me.rank}</span>
            <div className={styles.kamuTeks}>
              <p className={styles.kamuNama}>{me.name}</p>
              <p className={styles.kamuNote}>{me.note}</p>
            </div>
            <p className={styles.kamuPoin}>{me.points}</p>
          </section>
        ) : null}
      </div>

    </div>
  )
}

function BarisPeringkat({ entry }: { entry: LeaderboardEntry }) {
  return (
    <li className={styles.baris}>
      <span className={styles.peringkat}>{entry.rank}</span>
      <span className={styles.nama}>{entry.name}</span>
      <span className={styles.quests}>{entry.quests} quests</span>
      <span className={styles.poin}>{entry.points}</span>
    </li>
  )
}

/* ---- satu kolom podium ----------------------------------------------------- */

function PodiumKolom({
  entry,
  rank,
  tinggiAlas,
  juara = false,
}: {
  entry: PodiumEntry
  rank: number
  tinggiAlas: number
  juara?: boolean
}) {
  return (
    <li className={styles.podiumKolom}>
      <span className={`${styles.avatar} ${juara ? styles.avatarJuara : ""}`}>
        {entry.initials}
      </span>
      <p className={styles.podiumNama}>{entry.name}</p>
      <div
        className={`${styles.alas} ${juara ? styles.alasJuara : ""}`}
        /* Lewat properti kustom, bukan height langsung: blok @media di CSS
           perlu bisa mengalikannya untuk tablet. */
        style={{ "--tinggi-alas": `${tinggiAlas}px` } as CSSProperties}
      >
        <span className={styles.alasRank}>{rank}</span>
        <span className={styles.alasPoin}>{entry.points}</span>
      </div>
    </li>
  )
}
