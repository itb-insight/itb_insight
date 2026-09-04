import type { Metadata } from "next";
import type { Competition } from "@/features/competition/types";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://itbinsight.com"; // TODO: domain asli
export const SITE_NAME = "ITB Insight";

export function competitionMetadata(c: Competition): Metadata {
  const url = `${SITE_URL}/competition/${c.slug}`;
  return {
    title: c.seo.metaTitle,
    description: c.seo.metaDescription,
    keywords: c.seo.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      title: c.seo.metaTitle,
      description: c.seo.metaDescription,
      images: [{ url: c.seo.ogImage, width: 1200, height: 630, alt: c.title }],
      locale: "id_ID",
    },
    twitter: {
      card: "summary_large_image",
      title: c.seo.metaTitle,
      description: c.seo.metaDescription,
      images: [c.seo.ogImage],
    },
  };
}

/** JSON-LD schema.org/Event — bikin lomba muncul sbg rich result di Google. */
export function competitionJsonLd(c: Competition) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: c.title,
    description: c.seo.metaDescription,
    url: `${SITE_URL}/competition/${c.slug}`,
    image: [c.seo.ogImage],
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    organizer: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    offers: {
      "@type": "Offer",
      price: c.registrationFee,
      priceCurrency: "IDR",
      url: c.registerUrl,
      availability: "https://schema.org/InStock",
      // Dihilangkan dari JSON-LD kalau deadline belum ditentukan, supaya
      // tidak mengirim "validThrough": null ke Google.
      ...(c.registrationDeadline ? { validThrough: c.registrationDeadline } : {}),
    },
  };
}
