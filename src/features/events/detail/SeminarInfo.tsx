import type { EventDetail } from "@/features/events/types";
import DetailButton from "@/features/events/detail/DetailButton";
import styles from "@/features/events/detail/EventDetail.module.css";

/** Khusus Technology Seminar: sesi, siapa yang cocok, materi, cara daftar. */
export default function SeminarInfo({ seminar }: { seminar: NonNullable<EventDetail["seminar"]> }) {
  return (
    <>
      <section id="sesi" aria-labelledby="sesi-title" className={styles.section}>
        <h2 id="sesi-title" className={`${styles.sectionTitle} ${styles.iceText}`}>
          Sesi
        </h2>
        <div className={styles.sessions}>
          {seminar.sessions.map((s) => (
            <div key={s.label} className={styles.session}>
              <span className={styles.eyebrow}>{s.label}</span>
              <span className={styles.sessionTime}>{s.time} WIB</span>
              <span className={styles.sessionMeta}>
                {s.room} · {s.capacity}
              </span>
            </div>
          ))}
        </div>
        <p className={styles.text}>{seminar.whoFor}</p>
      </section>

      <section aria-labelledby="daftar-title" className={styles.section}>
        <h2 id="daftar-title" className={`${styles.sectionTitle} ${styles.iceText}`}>
          Materi &amp; pendaftaran
        </h2>
        <div className={styles.twoCol}>
          <div className={styles.block}>
            <h3 className={styles.subTitle}>Yang akan kamu pelajari</h3>
            <ul className={styles.ticks}>
              {seminar.learn.map((l) => (
                <li key={l} className={styles.tick}>
                  {l}
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.block}>
            <h3 className={styles.subTitle}>Cara daftar</h3>
            <ol className={styles.steps}>
              {seminar.register.map((r) => (
                <li key={r} className={styles.step}>
                  {r}
                </li>
              ))}
            </ol>
            <div className={styles.ctas}>
              <DetailButton
                cta={{ label: "RSVP", href: seminar.registerUrl, external: true }}
                variant="fill"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
