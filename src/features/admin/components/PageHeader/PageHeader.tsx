import styles from "./PageHeader.module.css"

interface PageHeaderProps {
  title: string
  subtitle?: string
  meta?: string
}

export default function PageHeader({ title, subtitle, meta }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {meta && <span className={styles.meta}>{meta}</span>}
    </header>
  )
}
