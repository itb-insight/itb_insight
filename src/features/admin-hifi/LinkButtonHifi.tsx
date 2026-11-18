import styles from "./LinkButtonHifi.module.css"

interface LinkButtonHifiProps {
  title: string
  description?: string
  href: string
  /** Buka di tab baru (untuk tautan ke PostHog, Vercel, dll.) */
  external?: boolean
}

export default function LinkButtonHifi({ title, description, href, external }: LinkButtonHifiProps) {
  return (
    <a
      className={styles.button}
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <span className={styles.title}>{title}</span>
      {description ? <span className={styles.description}>{description}</span> : null}
    </a>
  )
}
