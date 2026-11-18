import PanelHifi from "./PanelHifi"
import LinkButtonHifi from "./LinkButtonHifi"
import styles from "./ErrorMonitorHifi.module.css"

export interface ErrorStatHifi {
  label: string
  value: string
  note?: string
}

export interface ErrorLinkHifi {
  title: string
  description?: string
  href: string
}

interface ErrorMonitorHifiProps {
  title: string
  subtitle?: string
  stats: ErrorStatHifi[]
  /** Tautan ke alat pemantau di luar (PostHog, Vercel, Search Console) */
  links?: ErrorLinkHifi[]
}

export default function ErrorMonitorHifi({ title, subtitle, stats, links = [] }: ErrorMonitorHifiProps) {
  return (
    <PanelHifi title={title} subtitle={subtitle}>
      <div className={styles.body}>
        <ul className={styles.row}>
          {stats.map((stat) => (
            <li key={stat.label} className={styles.stat}>
              <p className={styles.label}>{stat.label}</p>
              <p className={styles.value}>{stat.value}</p>
              {stat.note ? <p className={styles.note}>{stat.note}</p> : null}
            </li>
          ))}
        </ul>

        {links.length > 0 ? (
          <div className={styles.row}>
            {links.map((link) => (
              <LinkButtonHifi
                key={link.title}
                title={link.title}
                description={link.description}
                href={link.href}
                external={link.href.startsWith("http")}
              />
            ))}
          </div>
        ) : null}
      </div>
    </PanelHifi>
  )
}
