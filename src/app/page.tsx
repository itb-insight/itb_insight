import Navbar from "@/shared/components/Navbar/Navbar"
import HeroSection from "@/features/landing/components/HeroSection/HeroSection"
import AboutSection from "@/features/landing/components/AboutSection/AboutSection"
import StatsSection from "@/features/landing/components/StatsSection/StatsSection"
import GallerySection from "@/features/landing/components/GallerySection/GallerySection"
import TimelineSection from "@/features/landing/components/TimelineSection/TimelineSection"
import MediaPartnersSection from "@/features/landing/components/MediaPartnersSection/MediaPartnersSection"
import Footer from "@/shared/components/Footer/Footer"

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <AboutSection />
      <StatsSection />
      <GallerySection />
      <TimelineSection />
      <MediaPartnersSection />
      <Footer />

    </main>
  )
}