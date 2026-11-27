import BarChartHifi, { type BarItemHifi } from "./BarChartHifi"
import styles from "./AktivitasVisitorHifi.module.css"

export interface KartuMedianHifi {
  /** Keterangan kecil di atas, mis. "Jeda antar scan". */
  label: string
  /** Angka besar, mis. "median 9 menit". */
  value: string
}

interface AktivitasVisitorHifiProps {
  title?: string
  subtitle?: string
  /** Corong: Check-in -> Scan 1 booth -> ... -> Klaim hadiah. */
  items: BarItemHifi[]
  /** Dua kartu di kaki panel. Kosongkan kalau tidak dipakai. */
  median?: KartuMedianHifi[]
}

/**
 * Aktivitas visitor — Figma node 1875:5149.
 *
 * Barisnya memakai BarChartHifi varian stacked (label + angka di atas, bar
 * selebar penuh di bawah) — persis susunan di dump. Yang ditambahkan di sini
 * cuma dua kartu median di kakinya.
 *
 * Catatan dump: ada instance "Tab (5 Tabs)" 162x40 di kepalanya, tapi isinya
 * kosong dan di gambar rancangannya memang tidak terlihat tab apa pun. Jadi
 * tidak digambar. Kalau ternyata perlu, tinggal oper lewat prop action
 * BarChartHifi seperti Keramaian Booth.
 */
export default function AktivitasVisitorHifi({
  title = "Aktivitas visitor",
  subtitle = "Deskripsi",
  items,
  median,
}: AktivitasVisitorHifiProps) {
  return (
    <BarChartHifi
      title={title}
      subtitle={subtitle}
      items={items}
      variant="stacked"
      footer={
        median && median.length > 0 ? (
          <ul className={styles.median}>
            {median.map((m) => (
              <li key={m.label} className={styles.kartu}>
                <p className={styles.label}>{m.label}</p>
                <p className={styles.value}>{m.value}</p>
              </li>
            ))}
          </ul>
        ) : null
      }
    />
  )
}
