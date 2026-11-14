import type { Metadata } from "next";
import type { Competition } from "@/features/competition/types";
import { registerEnabled, registrationState } from "@/features/competition/status";
import { lowestFee } from "@/features/competition/format";

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

/**
 * JSON-LD schema.org/Event — bikin lomba muncul sbg rich result di Google.
 * startDate = hari final. offers hanya dikirim selama pendaftaran dibuka
 * (tombol daftar aktif lewat env DAN masih dalam masa pendaftaran), dengan
 * harga terendah dan batas akhir pendaftaran.
 */
export function competitionJsonLd(c: Competition) {
  const open = registerEnabled(c) && registrationState(c) === "open";
  const registerUrl = c.registerUrl;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: c.title,
    description: c.seo.metaDescription,
    url: `${SITE_URL}/competition/${c.slug}`,
    image: [c.seo.ogImage],
    startDate: c.finalCountdown.date,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: "Institut Teknologi Bandung",
      address: { "@type": "PostalAddress", addressLocality: "Bandung", addressCountry: "ID" },
    },
    organizer: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    ...(open && registerUrl
      ? {
          offers: {
            "@type": "Offer",
            price: lowestFee(c.fees.map((f) => f.amount)),
            priceCurrency: "IDR",
            // Formulir eksternal (absolut). new URL() tetap aman bila suatu saat
            // tautannya relatif.
            url: new URL(registerUrl, SITE_URL).toString(),
            availability: "https://schema.org/InStock",
            validFrom: c.registration.opens,
            validThrough: c.registration.closes,
          },
        }
      : {}),
  };
}
