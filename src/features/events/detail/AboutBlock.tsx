import Image from "next/image";
import type { EventDetail } from "@/features/events/types";
import styles from "@/features/events/detail/EventDetail.module.css";

/** Deskripsi lengkap + satu foto, dengan pendar terang seperti foto di /event. */
export default function AboutBlock({ detail }: { detail: EventDetail }) {
  return (
    <section aria-labelledby="tentang" className={styles.section}>
      <div className={styles.about}>
        <div className={styles.aboutText}>
          <span className={styles.eyebrow}>Tentang</span>
          <h2 id="tentang" className={`${styles.sectionTitle} ${styles.iceText}`}>
            {detail.aboutTitle}
          </h2>
          {detail.about.map((p) => (
            <p key={p.slice(0, 32)} className={styles.text}>
              {p}
            </p>
          ))}
        </div>
        <div className={styles.photo}>
          <Image
            src={detail.aboutImage.src}
            alt={detail.aboutImage.alt}
            fill
            sizes="(max-width: 760px) 100vw, 520px"
            style={{ objectFit: "cover", objectPosition: detail.aboutImage.position ?? "50% 50%" }}
          />
        </div>
      </div>
    </section>
  );
}
