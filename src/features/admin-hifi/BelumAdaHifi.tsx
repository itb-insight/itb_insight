import PanelHifi from "./PanelHifi"
import styles from "./BelumAdaHifi.module.css"

interface BelumAdaProps {
  title: string
  subtitle?: string
  /** Apa yang kurang, sejelas mungkin — ini dibaca orang yang akan mengerjakannya. */
  catatan: string
  tinggi?: number
  /** Judul kotaknya. "Belum ada sumber data" untuk widget yang sudah dirancang tapi datanya belum ada. */
  label?: string
}

/**
 * Penanda widget yang BELUM dibuat, atau yang belum punya sumber data (lihat `label`).
 *
 * Sengaja memakai PanelHifi supaya tinggi dan jaraknya mendekati hasil akhir —
 * jadi tata letak halaman bisa dinilai sekarang — tapi isinya dibuat terang-
 * terangan kosong supaya tidak ada yang mengira ini sudah jadi.
 */
export default function BelumAdaHifi({ title, subtitle, catatan, tinggi = 160, label = "Belum dibuat" }: BelumAdaProps) {
  return (
    <PanelHifi title={title} subtitle={subtitle}>
      <div className={styles.kotak} style={{ minHeight: tinggi }}>
        <p className={styles.label}>{label}</p>
        <p className={styles.catatan}>{catatan}</p>
      </div>
    </PanelHifi>
  )
}
