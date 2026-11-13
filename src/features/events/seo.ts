import type { Metadata } from "next";
import type { EventDetail, EventItem } from "@/features/events/types";

/**
 * Domain produksi diambil dari env supaya bisa beda per lingkungan.
 * Nilai cadangan = alamat deploy yang tercantum di repo GitHub.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://itbinsight.vercel.app";
const SITE_NAME = "ITB Insight";
const PAGE_PATH = "/event";

const TITLE = "Events";
const DESCRIPTION =
  "Rangkaian acara ITB Insight 2026: Tech-Xhibition, Playtech & Showtech, Technology Seminar, Insight on Stage, Inspirates, dan Alumni Gathering di Kampus ITB Ganesha, Sabtu 28 November 2026.";

const OG_DEFAULT = `${SITE_URL}/events/tech-xhibition/og.jpg`;

const abs = (path: string) => (path.startsWith("http") ? path : `${SITE_URL}${path}`);
const plain = (title: string) => title.replace(/-?\n/g, (m) => (m === "-\n" ? "-" : " "));

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
      images: [{ url: OG_DEFAULT, width: 1200, height: 630, alt: "ITB Insight 2026" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${TITLE} | ${SITE_NAME}`,
      description: DESCRIPTION,
      images: [OG_DEFAULT],
    },
  };
}

const PLACE_BASE = {
  "@type": "Place",
  address: { "@type": "PostalAddress", addressLocality: "Bandung", addressCountry: "ID" },
};
const ORGANIZER = { "@type": "Organization", name: SITE_NAME, url: SITE_URL };

/**
 * JSON-LD /event: daftar acara sebagai schema.org/Event, supaya Google bisa
 * menampilkannya sebagai rich result (tanggal, lokasi) di hasil pencarian.
 * Event yang tanggalnya belum diumumkan (Coming Soon) tidak dimasukkan.
 */
export function eventsJsonLd(events: EventItem[]) {
  const listed = events.filter((e) => e.date !== null);
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: listed.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Event",
        name: plain(e.title),
        description: e.description,
        startDate: e.date,
        url: e.detailSlug
          ? `${SITE_URL}${PAGE_PATH}/${e.detailSlug}`
          : `${SITE_URL}${PAGE_PATH}#${e.slug}`,
        image: [abs(e.photo.src)],
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: { ...PLACE_BASE, name: e.location },
        organizer: ORGANIZER,
      },
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Halaman detail                                                      */
/* ------------------------------------------------------------------ */

export function eventDetailMetadata(d: EventDetail): Metadata {
  const url = `${SITE_URL}${PAGE_PATH}/${d.slug}`;
  const title = `${d.name} | ${SITE_NAME}`;
  const image = abs(d.ogImage);
  return {
    title,
    description: d.seoDescription,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      title,
      description: d.seoDescription,
      locale: "id_ID",
      images: [{ url: image, width: 1200, height: 630, alt: d.hero.alt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: d.seoDescription,
      images: [image],
    },
  };
}

export function eventDetailJsonLd(d: EventDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: d.name,
    description: d.summary,
    startDate: d.startDate,
    ...(d.endDate ? { endDate: d.endDate } : {}),
    url: `${SITE_URL}${PAGE_PATH}/${d.slug}`,
    image: [abs(d.ogImage), abs(d.hero.src)],
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    isAccessibleForFree: d.facts.ticket === "Gratis",
    location: { ...PLACE_BASE, name: d.facts.venue },
    organizer: ORGANIZER,
  };
}
