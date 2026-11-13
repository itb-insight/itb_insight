import type { EventDetail } from "@/features/events/types";
import styles from "@/features/events/detail/EventDetail.module.css";

/**
 * Daftar wahana/alat per zona. Tiap zona punya id sendiri (#playtech,
 * #showtech, #alat) yang ditautkan dari section /event dan tombol hero.
 */
export default function Attractions({
  attractions,
}: {
  attractions: NonNullable<EventDetail["attractions"]>;
}) {
  return (
    <section aria-labelledby="wahana" className={styles.section}>
      <h2 id="wahana" className={`${styles.sectionTitle} ${styles.iceText}`}>
        {attractions.title}
      </h2>
      <div className={styles.zones}>
        {attractions.groups.map((g) => (
          <div key={g.id} id={g.id} className={styles.zone}>
            <div className={styles.zoneHead}>
              <h3 className={`${styles.zoneTitle} ${styles.iceText}`}>{g.title}</h3>
              <span className={styles.zoneMeta}>
                {[g.area, `${g.items.length} ${g.unit}`]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
            <ul className={styles.rides}>
              {g.items.map((a) => (
                <li key={a.name} className={styles.ride}>
                  <span className={styles.rideName}>{a.name}</span>
                  <span className={styles.rideText}>{a.description}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
