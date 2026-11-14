import Image from "next/image";
import Link from "next/link";
import type { EventDetail } from "@/features/events/types";
import styles from "@/features/events/detail/EventDetail.module.css";

/** Kartu ke halaman detail event lain, plus tautan kembali ke /event. */
export default function OtherEvents({ events }: { events: EventDetail[] }) {
  return (
    <section aria-labelledby="lainnya-title" className={styles.section}>
      <h2 id="lainnya-title" className={`${styles.sectionTitle} ${styles.iceText}`}>
        Event lainnya
      </h2>
      <div className={styles.others}>
        {events.map((e) => (
          <Link key={e.slug} href={`/event/${e.slug}`} className={styles.otherCard}>
            <Image
              src={e.card.image.src}
              alt=""
              fill
              sizes="(max-width: 760px) 100vw, 280px"
              className={styles.otherImage}
              style={{ objectFit: "cover" }}
            />
            <div className={styles.otherBody}>
              <span className={styles.otherName}>{e.name}</span>
              <span className={styles.otherMeta}>
                {e.card.when} · {e.card.where}
              </span>
            </div>
          </Link>
        ))}
      </div>
      <Link href="/event" className={`${styles.btn} ${styles.btnLine} ${styles.backLink}`}>
        ← Semua event
      </Link>
    </section>
  );
}
