import TrackedSection from "@/lib/analytics/components/TrackedSection"
import PartnerCard from "./PartnerCard"
import styles from "./MediaPartnersSection.module.css"

const bigPartners = [
  { id: "partner-alpha", tier: "platinum", src: "/images/partners/partner-1.png", alt: "Big Partner 1" },
  { id: "partner-beta", tier: "platinum", src: "/images/partners/partner-1.png", alt: "Big Partner 2" },
]

const partners = [
  { id: "partner-1", tier: "gold", src: "/images/partners/partner-2.png", alt: "Partner 1" },
  { id: "partner-2", tier: "gold", src: "/images/partners/partner-2.png", alt: "Partner 2" },
  { id: "partner-3", tier: "silver", src: "/images/partners/partner-2.png", alt: "Partner 3" },
  { id: "partner-4", tier: "silver", src: "/images/partners/partner-2.png", alt: "Partner 4" },
  { id: "partner-5", tier: "silver", src: "/images/partners/partner-2.png", alt: "Partner 5" },
]

export default function MediaPartnersSection() {
  return (
    <TrackedSection
      sectionId="media-partners"
      division="SP"
      eventName="sponsor_impression"
      minVisibleMs={1000}
      className={styles.mediaPartners}
    >
      <h2 className={styles.title}>MEDIA PARTNERS</h2>

      <div className={styles.mainRow}>
        {bigPartners.map((p) => (
          <PartnerCard
            key={p.id}
            sponsorId={p.id}
            tier={p.tier}
            src={p.src}
            alt={p.alt}
            sizes="(max-width: 768px) 80vw, 35vw"
            className={styles.mainCard}
            logoClassName={styles.logo}
          />
        ))}
      </div>

      <div className={styles.secondaryRow}>
        {partners.map((p) => (
          <PartnerCard
            key={p.id}
            sponsorId={p.id}
            tier={p.tier}
            src={p.src}
            alt={p.alt}
            sizes="(max-width: 768px) 40vw, 15vw"
            className={styles.secondaryCard}
            logoClassName={styles.logo}
          />
        ))}
      </div>
    </TrackedSection>
  )
}
