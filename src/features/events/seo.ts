import type { Metadata } from "next";
import type { EventItem } from "@/features/events/types";

/**
 * Domain produksi diambil dari env supaya bisa beda per lingkungan.
 * Nilai cadangan = alamat deploy yang tercantum di repo GitHub.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://itbinsight.vercel.app";
const SITE_NAME = "ITB Insight";
const PAGE_PATH = "/events";

const TITLE = "Events";
const DESCRIPTION =
  "Rangkaian acara ITB Insight 2026: Insight Festival, Exhibition Manager, Play-Tech, Show-Tech, Insight on Stage, Inspirates, dan Alumni Gathering di Sabuga, ITB.";

export function eventsMetadata(): Metadata {
  const url = `${SITE_URL}${PAGE_PATH}`;
  return {
    title: `${TITLE} | ${SITE_NAME}`,
    description: DESCRIPTION,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      title: `${TITLE} | ${SITE_NAME}`,
      description: DESCRIPTION,
      locale: "id_ID",
      images: [{ url: `${SITE_URL}/events/event-photo.jpg`, width: 1600, height: 1067, alt: "Dokumentasi kegiatan ITB Insight" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${TITLE} | ${SITE_NAME}`,
      description: DESCRIPTION,
      images: [`${SITE_URL}/events/event-photo.jpg`],
    },
  };
}

/**
 * JSON-LD: daftar acara sebagai schema.org/Event, supaya Google bisa
 * menampilkannya sebagai rich result (tanggal, lokasi) di hasil pencarian.
 */
export function eventsJsonLd(events: EventItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: events.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Event",
        name: e.title.replace(/\n/g, " "),
        description: e.description,
        startDate: e.date,
        url: `${SITE_URL}${PAGE_PATH}#${e.slug}`,
        image: [`${SITE_URL}/events/event-photo.jpg`],
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
          "@type": "Place",
          name: e.location,
          address: { "@type": "PostalAddress", addressLocality: "Bandung", addressCountry: "ID" },
        },
        organizer: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      },
    })),
  };
}
