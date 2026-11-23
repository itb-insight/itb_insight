import type { CSSProperties } from "react"

import styles from "./SummaryCardsHifi.module.css"

export interface SummaryCardHifi {
  title: string
  value: string
  caption: string
}

interface SummaryCardsHifiProps {
  /**
   * Satu sampai empat kartu; jumlah kolomnya mengikuti. Lebih dari empat tetap
   * empat kolom dan lanjut ke baris berikutnya.
   */
  items: SummaryCardHifi[]
  /** Label daftar untuk pembaca layar */
  label?: string
}

/*
 * Posisi teks di tiap kartu, persis dari Figma (piksel, relatif ke kartu).
 * Desainernya meletakkan teks secara manual, jadi tiap kartu berbeda:
 * judul kartu 1 di tengah, kartu 2–4 rata kiri dengan jarak yang tidak sama,
 * dan baris angka/catatan kartu 3–4 lima piksel lebih tinggi.
 * Untuk teks rata tengah, x adalah titik tengahnya — jadi angka yang lebih
 * panjang atau lebih pendek tetap berada di tengah.
 */
const SLOTS = [
  { title: { x: 165, y: 40, center: true }, value: { x: 164, y: 78 }, caption: { x: 166.5, y: 154 } },
  { title: { x: 32, y: 32, center: false }, value: { x: 160, y: 78 }, caption: { x: 161, y: 154 } },
  { title: { x: 57, y: 32, center: false }, value: { x: 160, y: 73 }, caption: { x: 160, y: 148 } },
  { title: { x: 59, y: 32, center: false }, value: { x: 165, y: 73 }, caption: { x: 161, y: 148 } },
]

/** Lebar kartu di Figma. Dipakai untuk mengubah titik-x jadi persentase. */
const LEBAR_KARTU_FIGMA = 330

/*
  Titik rata-kiri tetap piksel (jaraknya dari tepi kiri memang tetap), tapi
  titik rata-tengah diubah jadi persentase.

  Alasannya: kartunya tidak selalu 330px. Di halaman tiga-kartu lebarnya ~440px,
  dan titik tengah yang dipaku 165px akan membuat teksnya melenceng 55px ke kiri.
  Dengan persentase, letaknya tetap benar di lebar berapa pun — dan di lebar 330
  hasilnya sama persis dengan angka Figma.
*/
const at = (x: number, y: number, relatif = false) =>
  ({
    "--x": relatif ? `${((x / LEBAR_KARTU_FIGMA) * 100).toFixed(3)}%` : `${x}px`,
    "--y": `${y}px`,
  }) as CSSProperties

export default function SummaryCardsHifi({ items, label = "Rangkuman" }: SummaryCardsHifiProps) {
  const kolom = Math.min(Math.max(items.length, 1), 4)

  return (
    <ul
      className={styles.grid}
      aria-label={label}
      style={{ "--kolom": kolom } as CSSProperties}
    >
      {items.map((item, i) => {
        const slot = SLOTS[i % SLOTS.length]
        return (
          <li key={item.title} className={styles.card}>
            <p
              className={`${styles.title} ${slot.title.center ? styles.centered : ""}`}
              style={at(slot.title.x, slot.title.y, slot.title.center)}
            >
              {item.title}
            </p>
            <p
              className={`${styles.value} ${styles.centered}`}
              style={at(slot.value.x, slot.value.y, true)}
            >
              {item.value}
            </p>
            <p
              className={`${styles.caption} ${styles.centered}`}
              style={at(slot.caption.x, slot.caption.y, true)}
            >
              {item.caption}
            </p>
          </li>
        )
      })}
    </ul>
  )
}
