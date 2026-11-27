import PanelHifi from "@/features/admin-hifi/PanelHifi"
import styles from "./BelumAda.module.css"

interface BelumAdaProps {
  title: string
  subtitle?: string
  /** Apa yang kurang, sejelas mungkin — ini dibaca orang yang akan mengerjakannya. */
  catatan: string
  tinggi?: number
}

/**
 * Penanda widget yang BELUM dibuat.
 *
 * Sengaja memakai PanelHifi supaya tinggi dan jaraknya mendekati hasil akhir —
 * jadi tata letak halaman bisa dinilai sekarang — tapi isinya dibuat terang-
 * terangan kosong supaya tidak ada yang mengira ini sudah jadi.
 */
export default function BelumAda({ title, subtitle, catatan, tinggi = 160 }: BelumAdaProps) {
  return (
    <PanelHifi title={title} subtitle={subtitle}>
      <div className={styles.kotak} style={{ minHeight: tinggi }}>
        <p className={styles.label}>Belum dibuat</p>
        <p className={styles.catatan}>{catatan}</p>
      </div>
    </PanelHifi>
  )
}
