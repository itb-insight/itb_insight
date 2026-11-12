import Image from "next/image"
import styles from "./SponsorsSectionHifi.module.css"

type Sponsor = {
  /** File name inside public/sponsors */
  file: string
  alt: string
  /** Sponsor website. `null` = no link (card is not clickable). */
  href: string | null
}

const sponsors: Sponsor[] = [
  { file: "LPDP (L).png", alt: "LPDP", href: "https://lpdp.kemenkeu.go.id" },
  { file: "Kementrian Kebudayaan (L).webp", alt: "Kementerian Kebudayaan Republik Indonesia", href: "https://kemenbud.go.id" },
  { file: "KAI (XL).png", alt: "KAI", href: "https://www.kai.id" },
  { file: "JETE (XL).png", alt: "JETE", href: "https://jete.id" },
  { file: "Mitsubshi (M).png", alt: "Mitsubishi Electric Indonesia", href: "https://www.mitsubishielectric.co.id" },
  { file: "FORMULATRIX (S).png", alt: "Formulatrix", href: "https://formulatrix.com" },
  { file: "Logo Bestlaptop.id.jpg", alt: "bestlaptop.id", href: "https://store.bestlaptop.id" },
  { file: "Logo InvstID 2025.png", alt: "invst.id", href: "https://invst.id" },
]

export default function SponsorsSectionHifi() {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>OUR SPONSORS</h2>

      <ul className={styles.grid}>
        {sponsors.map((s) => {
          const logo = (
            <Image
              // Filenames contain spaces/parentheses, so the URL must be encoded.
              src={`/sponsors/${encodeURIComponent(s.file)}`}
              alt={s.alt}
              fill
              sizes="(max-width: 768px) 45vw, 260px"
              className={styles.logo}
            />
          )
          return (
            <li key={s.file} className={styles.item}>
              {s.href ? (
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.card} ${styles.clickable}`}
                  aria-label={`${s.alt} (opens website in a new tab)`}
                >
                  {logo}
                </a>
              ) : (
                <div className={styles.card}>{logo}</div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
