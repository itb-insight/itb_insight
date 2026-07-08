import Image from "next/image"
import styles from "./MediaPartnersSection.module.css"

const bigPartners = [
  { src: "/images/partners/partner-1.png", alt: "Big Partner 1" },
  { src: "/images/partners/partner-1.png", alt: "Big Partner 2" },
]

const partners = [
  { src: "/images/partners/partner-2.png", alt: "Partner 1" },
  { src: "/images/partners/partner-2.png", alt: "Partner 2" },
  { src: "/images/partners/partner-2.png", alt: "Partner 3" },
  { src: "/images/partners/partner-2.png", alt: "Partner 4" },
  { src: "/images/partners/partner-2.png", alt: "Partner 5" },
]

export default function MediaPartnersSection() {
  return (
    <section className={styles.mediaPartners}>
      <h2 className={styles.title}>MEDIA PARTNERS</h2>

      <div className={styles.mainRow}>
        {bigPartners.map((p, i) => (
          <div key={i} className={styles.mainCard}>
            <Image
              src={p.src}
              alt={p.alt}
              fill
              sizes="(max-width: 768px) 80vw, 35vw"
              className={styles.logo}
            />
          </div>
        ))}
      </div>

      <div className={styles.secondaryRow}>
        {partners.map((p, i) => (
          <div key={i} className={styles.secondaryCard}>
            <Image
              src={p.src}
              alt={p.alt}
              fill
              sizes="(max-width: 768px) 40vw, 15vw"
              className={styles.logo}
            />
          </div>
        ))}
      </div>
    </section>
  )
}