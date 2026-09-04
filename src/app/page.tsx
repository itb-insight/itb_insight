import Navbar from "@/shared/components/Navbar/Navbar"
import NavbarHifi from "@/shared/components/Navbar/NavbarHifi/NavbarHifi"
import HeroSection from "@/features/landing/components/HeroSection/HeroSection"
import HeroSectionHifi from "@/features/landing/components/HeroSectionHifi/HeroSectionHifi"
import AboutSection from "@/features/landing/components/AboutSection/AboutSection"
import AboutSectionHifi from "@/features/landing/components/AboutSectionHifi/AboutSectionHifi"
import StatsSection from "@/features/landing/components/StatsSection/StatsSection"
import StatsSectionHifi from "@/features/landing/components/StatsSectionHifi/StatsSectionHifi"
import GallerySection from "@/features/landing/components/GallerySection/GallerySection"
import GallerySectionHifi from "@/features/landing/components/GallerySectionHifi/GallerySectionHifi"
import TimelineSection from "@/features/landing/components/TimelineSection/TimelineSection"
import TimelineSectionHifi from "@/features/landing/components/TimelineSectionHifi/TimelineSectionHifi"
import MediaPartnersSection from "@/features/landing/components/MediaPartnersSection/MediaPartnersSection"
import MediaPartnersSectionHifi from "@/features/landing/components/MediaPartnersSectionHifi/MediaPartnersSectionHifi"
import Footer from "@/shared/components/Footer/Footer"
import FooterHifi from "@/shared/components/Footer/FooterHifi/FooterHifi"
import styles from "@/features/landing/LandingPage.module.css"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

// Mirrors the Timeline section's own dates (registration open -> final).
const eventJsonLd = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: "ITB Insight 2026",
  description:
    "Insight ITB merupakan event teknologi terbesar di ITB, terdiri dari beberapa rangkaian acara seperti pameran, seminar, dan kompetisi.",
  startDate: "2026-01-05",
  endDate: "2026-03-01",
  eventStatus: "https://schema.org/EventScheduled",
  image: [`${siteUrl}/images/logoinsight-hifi.png`],
  organizer: {
    "@type": "Organization",
    name: "ITB Insight",
    url: siteUrl,
  },
}

export default function HomePage() {
  return (
    <main className={styles.landingContainer}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />
      <NavbarHifi />
      <HeroSectionHifi />
      <AboutSectionHifi />
      <StatsSectionHifi />
      <GallerySectionHifi />
      <TimelineSectionHifi />
      <MediaPartnersSectionHifi />
      <FooterHifi />

    </main>
  )
}