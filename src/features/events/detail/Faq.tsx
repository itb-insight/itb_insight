import type { EventDetail } from "@/features/events/types";
import styles from "@/features/events/detail/EventDetail.module.css";

/** FAQ dengan <details>: bisa dibuka-tutup tanpa JavaScript. Pertanyaan pertama terbuka. */
export default function Faq({ faq }: { faq: NonNullable<EventDetail["faq"]> }) {
  return (
    <section aria-labelledby="faq-title" className={styles.section}>
      <h2 id="faq-title" className={`${styles.sectionTitle} ${styles.iceText}`}>
        FAQ
      </h2>
      <div className={styles.faq}>
        {faq.map((f, i) => (
          <details key={f.q} className={styles.faqItem} open={i === 0}>
            <summary className={styles.faqQ}>{f.q}</summary>
            <p className={styles.faqA}>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
