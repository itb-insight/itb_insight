import Image from "next/image";
import { HERO_CURTAIN } from "@/features/events/EventsHero";
import styles from "@/features/events/EventMobile.module.css";

/**
 * Hero "EVENTS." untuk layar < 900px. Lapisan sama dengan EventsHero
 * (gradient, tirai, teks, panel terang yang memotong dasar huruf), tapi
 * tingginya ~88% lebar layar, bukan 59%, dan semua ukuran dalam satuan 1vw
 * (berhenti di 636px), bukan kanvas 1728 yang diskalakan.
 *
 * Teks tetap h1 asli. Hanya satu h1 yang tampil per lebar layar, dan id-nya
 * dibedakan dari versi desktop supaya tidak kembar di DOM.
 */
export default function EventsHeroMobile({ className }: { className?: string }) {
  return (
    <section aria-labelledby="events-hero-title-m" className={className}>
      <div className={styles.hero}>
        <div className={styles.curtain}>
          <Image src={HERO_CURTAIN} alt="" aria-hidden="true" fill sizes="100vw" style={{ objectFit: "cover" }} />
        </div>
        <div className={styles.heroInner}>
          <h1 id="events-hero-title-m" className={styles.heroTitle}>
            EVENTS.
          </h1>
        </div>
        <div aria-hidden="true" className={styles.panel} />
      </div>
    </section>
  );
}
