import LandingPageHifi from "@/features/landing/components/LandingPageHifi/LandingPageHifi"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

const eventJsonLd = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: "ITB Insight 2026",
  description:
    "Insight ITB merupakan event teknologi terbesar di ITB, terdiri dari beberapa rangkaian acara seperti pameran, seminar, dan kompetisi.",
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
    <LandingPageHifi>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />
    </LandingPageHifi>
  )
}
