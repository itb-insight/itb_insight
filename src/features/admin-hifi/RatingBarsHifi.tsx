import type { CSSProperties } from "react"

import PanelHifi from "./PanelHifi"
import { KATEGORI, URUTAN_KATEGORI, type KategoriFeedback } from "./kategoriFeedback"
import styles from "./RatingBarsHifi.module.css"

export interface RatingBarItemHifi {
  /** Nama objek, mis. "Drone Showcase". */
  label: string
  kategori: KategoriFeedback
  /** Rata-rata 0–5, mis. 4.8. */
  value: number
  /** Jumlah responden; ditulis setelah nilainya sebagai "n 142". */
  n: number
}

interface RatingBarsHifiProps {
  title: string
  subtitle?: string
  items: RatingBarItemHifi[]
  /** Baris kecil di bawah daftar. */
  caption?: string
}

/** Skala penuh bar: 0 sampai 5 bintang. */
const SKALA = 5

/** "4,8 n 142" — koma desimal, lalu jumlah responden. */
const tulisNilai = (value: number, n: number) => `${value.toFixed(1).replace(".", ",")} n ${n}`

/**
 * Rating — Figma node 1937:3828.
 *
 * Cuma menggambar; datanya dioper dari luar.
 */
export default function RatingBarsHifi({ title, subtitle, items, caption }: RatingBarsHifiProps) {
  return (
    <PanelHifi
      title={title}
      subtitle={subtitle}
      action={
        <ul className={styles.legenda}>
          {URUTAN_KATEGORI.map((k) => (
            <li key={k} className={styles.legendaButir}>
              <span className={styles.titik} style={{ background: KATEGORI[k].titik }} />
              {KATEGORI[k].legenda}
            </li>
          ))}
        </ul>
      }
    >
      <div className={styles.isi}>
        <ul className={styles.baris}>
          {items.map((item) => {
            const gaya = KATEGORI[item.kategori]
            /* Panjang isian = nilai / 5. Lihat catatan di CSS soal kenapa
               menerus, bukan lima segmen seperti di dump. */
            const terisi = Math.max(0, Math.min(1, item.value / SKALA))
            const warna = {
              "--warna-bar": gaya.bar,
              "--terisi": `${(terisi * 100).toFixed(2)}%`,
            } as CSSProperties

            return (
              <li key={`${item.kategori}-${item.label}`} className={styles.sel}>
                <p className={styles.nama}>{item.label}</p>

                <span
                  className={styles.lencana}
                  style={{ background: gaya.bgLencana, color: gaya.warnaLencana }}
                >
                  {gaya.lencana}
                </span>

                <div
                  className={styles.bar}
                  style={warna}
                  role="img"
                  aria-label={`${item.label}: ${tulisNilai(item.value, item.n)} dari 5`}
                >
                  <div className={styles.isian} />
                </div>

                <p className={styles.nilai}>{tulisNilai(item.value, item.n)}</p>
              </li>
            )
          })}
        </ul>

        {caption ? <p className={styles.kaki}>{caption}</p> : null}
      </div>
    </PanelHifi>
  )
}
