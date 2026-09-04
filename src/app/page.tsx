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

export default function HomePage() {
  return (
    <main className={styles.landingContainer}>
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