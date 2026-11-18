import type { CSSProperties } from "react"

import styles from "./SummaryCardsHifi.module.css"

export interface SummaryCardHifi {
  title: string
  value: string
  caption: string
}

interface SummaryCardsHifiProps {
  /** Empat kartu. Lebih dari empat akan lanjut ke baris berikutnya. */
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

const at = (x: number, y: number) => ({ "--x": `${x}px`, "--y": `${y}px` }) as CSSProperties

export default function SummaryCardsHifi({ items, label = "Rangkuman" }: SummaryCardsHifiProps) {
  return (
    <ul className={styles.grid} aria-label={label}>
      {items.map((item, i) => {
        const slot = SLOTS[i % SLOTS.length]
        return (
          <li key={item.title} className={styles.card}>
            <p
              className={`${styles.title} ${slot.title.center ? styles.centered : ""}`}
              style={at(slot.title.x, slot.title.y)}
            >
              {item.title}
            </p>
            <p
              className={`${styles.value} ${styles.centered}`}
              style={at(slot.value.x, slot.value.y)}
            >
              {item.value}
            </p>
            <p
              className={`${styles.caption} ${styles.centered}`}
              style={at(slot.caption.x, slot.caption.y)}
            >
              {item.caption}
            </p>
          </li>
        )
      })}
    </ul>
  )
}
