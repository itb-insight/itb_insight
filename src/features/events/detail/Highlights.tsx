import type { EventDetail } from "@/features/events/types";
import styles from "@/features/events/detail/EventDetail.module.css";

/** Sorotan: hal yang bisa dilakukan/dilihat, dari lembar copywriting bagian D. */
export default function Highlights({ detail }: { detail: EventDetail }) {
  return (
    <section aria-labelledby="sorotan" className={styles.section}>
      <h2 id="sorotan" className={`${styles.sectionTitle} ${styles.iceText}`}>
        {detail.highlightsTitle}
      </h2>
      <ol className={`${styles.highlights} ${styles[`highlights${detail.highlights.length}`] ?? ""}`}>
        {detail.highlights.map((h, i) => (
          <li key={h.text} className={styles.highlight}>
            <span className={styles.highlightNum} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            {h.title ? <h3 className={styles.highlightTitle}>{h.title}</h3> : null}
            <p className={styles.highlightText}>{h.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
