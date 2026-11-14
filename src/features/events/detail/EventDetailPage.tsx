import type { CSSProperties } from "react";
import type { EventDetail } from "@/features/events/types";
import DetailHero from "@/features/events/detail/DetailHero";
import QuickFacts from "@/features/events/detail/QuickFacts";
import AboutBlock from "@/features/events/detail/AboutBlock";
import Highlights from "@/features/events/detail/Highlights";
import SchoolVisits from "@/features/events/detail/SchoolVisits";
import SeminarInfo from "@/features/events/detail/SeminarInfo";
import Attractions from "@/features/events/detail/Attractions";
import Rundown from "@/features/events/detail/Rundown";
import PracticalInfo from "@/features/events/detail/PracticalInfo";
import Faq from "@/features/events/detail/Faq";
import DetailGallery from "@/features/events/detail/DetailGallery";
import OtherEvents from "@/features/events/detail/OtherEvents";
import EventsBackdrop from "@/features/events/EventsBackdrop";
import styles from "@/features/events/detail/EventDetail.module.css";

/**
 * Satu template untuk semua halaman detail. Blok opsional (jadwal sekolah,
 * sesi seminar, wahana, rundown, FAQ, ...) hanya tampil kalau datanya ada
 * di details.ts, jadi tiap event mendapat susunan yang sesuai isinya.
 *
 * Latar di bawah hero = latar /event (EventsBackdrop): gradient dan
 * ornamen Figma yang sama.
 *
 * Server Component murni: tidak ada JavaScript tambahan di halaman.
 */
export default function EventDetailPage({
  detail,
  others,
  today,
}: {
  detail: EventDetail;
  others: EventDetail[];
  /** Tanggal hari ini di WIB, "YYYY-MM-DD" */
  today: string;
}) {
  return (
    <main className={styles.page} style={{ "--accent": detail.accent } as CSSProperties}>
      <DetailHero detail={detail} />
      <div className={styles.body}>
        <EventsBackdrop />
        <div className={styles.container}>
          <QuickFacts facts={detail.facts} />
          <AboutBlock detail={detail} />
          <Highlights detail={detail} />
          {detail.schoolVisits ? <SchoolVisits visits={detail.schoolVisits} today={today} /> : null}
          {detail.seminar ? <SeminarInfo seminar={detail.seminar} /> : null}
          {detail.attractions ? <Attractions attractions={detail.attractions} /> : null}
          {detail.rundown ? <Rundown rundown={detail.rundown} /> : null}
          <PracticalInfo detail={detail} />
          {detail.faq?.length ? <Faq faq={detail.faq} /> : null}
          <DetailGallery images={detail.gallery} />
          <OtherEvents events={others} />
        </div>
      </div>
    </main>
  );
}
