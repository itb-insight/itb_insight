import { notFound } from "next/navigation";
import type { Metadata } from "next";
import EventDetailPage from "@/features/events/detail/EventDetailPage";
import NavbarHifi from "@/shared/components/Navbar/NavbarHifi/NavbarHifi";
import FooterHifi from "@/shared/components/Footer/FooterHifi/FooterHifi";
import { getAllEventDetails, getEventDetail, getEventDetailSlugs } from "@/features/events/details";
import { eventDetailJsonLd, eventDetailMetadata } from "@/features/events/seo";

/**
 * Halaman detail satu event: /event/tech-xhibition, /event/playtech-showtech,
 * /event/technology-seminar, /event/insight-on-stage, /event/inspirates.
 *
 * SSG + ISR: semua halaman dibangun saat build lalu disegarkan tiap 1 jam
 * (status jadwal sekolah Inspirates ikut berganti). Slug lain -> 404,
 * termasuk Alumni Gathering yang masih Coming Soon.
 *
 * Data: src/features/events/details.ts.
 */
export const revalidate = 3600;
export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await getEventDetailSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getEventDetail(slug);
  if (!detail) return { title: "Event tidak ditemukan" };
  return eventDetailMetadata(detail);
}

/** Tanggal hari ini di WIB, format YYYY-MM-DD (locale en-CA memberi format ISO). */
function todayInJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

export default async function EventDetailRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getEventDetail(slug);
  if (!detail) notFound();

  const others = (await getAllEventDetails()).filter((d) => d.slug !== detail.slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventDetailJsonLd(detail)) }}
      />
      <NavbarHifi />
      <EventDetailPage detail={detail} others={others} today={todayInJakarta()} />
      <FooterHifi />
    </>
  );
}
