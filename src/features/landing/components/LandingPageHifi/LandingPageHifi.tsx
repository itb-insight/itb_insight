import NavbarHifi from "@/shared/components/Navbar/NavbarHifi/NavbarHifi"
import HeroSectionHifi from "@/features/landing/components/HeroSectionHifi/HeroSectionHifi"
import AboutSectionHifi from "@/features/landing/components/AboutSectionHifi/AboutSectionHifi"
import StatsSectionHifi from "@/features/landing/components/StatsSectionHifi/StatsSectionHifi"
import GallerySectionHifi from "@/features/landing/components/GallerySectionHifi/GallerySectionHifi"
import TimelineSectionHifi from "@/features/landing/components/TimelineSectionHifi/TimelineSectionHifi"
import SponsorsSectionHifi from "@/features/landing/components/SponsorsSectionHifi/SponsorsSectionHifi"
import MediaPartnersSectionHifi from "@/features/landing/components/MediaPartnersSectionHifi/MediaPartnersSectionHifi"
import FooterHifi from "@/shared/components/Footer/FooterHifi/FooterHifi"
import LandingBackground from "@/features/landing/components/LandingBackground/LandingBackground"
import styles from "@/features/landing/LandingPage.module.css"

/**
 * The hi-fi landing page body. Rendered by "/" and, behind the pop-up, by /feedback/[slug].
 */
export default function LandingPageHifi({ children }: { children?: React.ReactNode }) {
  return (
    <main className={styles.landingContainer}>
      {children}
      <LandingBackground />
      <NavbarHifi />
      <HeroSectionHifi />
      <AboutSectionHifi />
      <StatsSectionHifi />
      <GallerySectionHifi />
      <TimelineSectionHifi />
      <SponsorsSectionHifi />
      <MediaPartnersSectionHifi />
      <FooterHifi />
    </main>
  )
}
