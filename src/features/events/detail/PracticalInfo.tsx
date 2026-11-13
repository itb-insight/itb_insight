import type { EventDetail } from "@/features/events/types";
import styles from "@/features/events/detail/EventDetail.module.css";

/** Info praktis: yang perlu dibawa, aturan, cara check-in. Kolom kosong tidak tampil. */
export default function PracticalInfo({ detail }: { detail: EventDetail }) {
  const { bring, rules, checkIn } = detail;
  if (!bring?.length && !rules?.length && !checkIn?.length) return null;

  return (
    <section id="info" aria-labelledby="info-title" className={styles.section}>
      <h2 id="info-title" className={`${styles.sectionTitle} ${styles.iceText}`}>
        Info praktis
      </h2>
      <div className={styles.twoCol}>
        {bring?.length ? (
          <div className={styles.block}>
            <h3 className={styles.subTitle}>Yang perlu dibawa</h3>
            <ul className={styles.ticks}>
              {bring.map((b) => (
                <li key={b} className={styles.tick}>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {checkIn?.length ? (
          <div className={styles.block}>
            <h3 className={styles.subTitle}>Cara check-in</h3>
            <ol className={styles.steps}>
              {checkIn.map((c) => (
                <li key={c} className={styles.step}>
                  {c}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
        {rules?.length ? (
          <div className={styles.block}>
            <h3 className={styles.subTitle}>Aturan</h3>
            <ul className={styles.ticks}>
              {rules.map((r) => (
                <li key={r} className={styles.tick}>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
