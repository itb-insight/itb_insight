import styles from "./WidgetCard.module.css"

interface WidgetCardProps {
  title: string
  description?: string
  /** Kontrol di kanan atas (mis. RangeTabs) */
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}

/**
 * Bingkai standar widget /admin hi-fi: judul + deskripsi + aksi di kanan,
 * gradient biru, stroke #517EDA. Bisa dipakai juga oleh widget lain
 * (Tabel, Bar Chart, Rangkuman) supaya tampilannya seragam.
 */
export default function WidgetCard({ title, description, action, className, children }: WidgetCardProps) {
  return (
    <section className={`${styles.card} ${className ?? ""}`}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <h2 className={styles.title}>{title}</h2>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}
