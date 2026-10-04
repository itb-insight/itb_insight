import type { Metadata } from "next";
import EventsHero from "@/features/events/EventsHero";
import EventSection from "@/features/events/EventSection";
import { getEvents } from "@/features/events/data";
import { eventsJsonLd, eventsMetadata } from "@/features/events/seo";
import NavbarHifi from "@/shared/components/Navbar/NavbarHifi/NavbarHifi";
import FooterHifi from "@/shared/components/Footer/FooterHifi/FooterHifi";

/**
 * Halaman Events (desktop).
 *
 * Rendering: Server Component, dirender statis saat build lalu disegarkan
 * tiap 1 jam (ISR). HTML lengkap langsung terkirim — tidak ada JavaScript
 * yang dibutuhkan untuk menampilkan halaman ini.
 *
 * Data: getEvents() di src/features/events/data.ts. Saat pindah ke
 * Supabase/CMS, cukup ganti isi fungsi itu.
 */
export const revalidate = 3600;

export const metadata: Metadata = eventsMetadata();

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <main style={{ background: "#091b3f" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventsJsonLd(events)) }}
      />

      <NavbarHifi />

      <EventsHero />

      {events.map((event, i) => (
        <EventSection key={event.slug} event={event} index={i} />
      ))}

      <FooterHifi />
    </main>
  );
}
