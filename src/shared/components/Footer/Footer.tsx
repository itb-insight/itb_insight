import Link from "next/link"
import { Mail } from "lucide-react"
import styles from "./Footer.module.css"

const socials = [
  { href: "https://instagram.com/itbinsight", label: "Instagram" },
  { href: "mailto:support@itbinsight.com", label: "Email dukungan" },
]

function InstagramIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".75" fill="currentColor" stroke="none" /></svg>
}

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <p className={styles.name}>ITB Insight</p>
          <p className={styles.tagline}>HMFT-ITB · Insight 2026</p>
        </div>
        <nav className={styles.links} aria-label="Tautan footer">
          <Link href="/terms-and-conditions">Syarat & Ketentuan</Link>
          <a href="mailto:support@itbinsight.com">support@itbinsight.com</a>
        </nav>
        <div className={styles.socials} aria-label="Kanal resmi">
          {socials.map(({ href, label }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              aria-label={label}
              className={styles.socialLink}
            >
              {label === "Instagram" ? <InstagramIcon /> : <Mail aria-hidden="true" size={20} />}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
