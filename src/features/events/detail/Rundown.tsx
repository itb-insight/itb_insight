import type { EventDetail, RundownGroup } from "@/features/events/types";
import styles from "@/features/events/detail/EventDetail.module.css";

/**
 * Rangkaian acara.
 *   satu grup       timeline vertikal; tanpa jam = nomor urut (01, 02, ...)
 *   beberapa grup   kartu per bagian hari (pagi / malam), misal Insight on Stage
 */
function Timeline({ group }: { group: RundownGroup }) {
  return (
    <ol className={styles.timeline}>
      {group.items.map((item, i) => (
        <li key={`${item.time ?? i}-${item.title}`} className={styles.tlItem}>
          <span className={styles.tlTime}>{item.time ?? String(i + 1).padStart(2, "0")}</span>
          <span className={styles.tlRail} aria-hidden="true" />
          <div className={styles.tlBody}>
            <span className={styles.tlTitle}>{item.title}</span>
            {item.note ? <span className={styles.tlNote}>{item.note}</span> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function DayParts({ groups }: { groups: RundownGroup[] }) {
  return (
    <div className={styles.dayParts}>
      {groups.map((g) => (
        <div
          key={g.title}
          className={`${styles.dayPart} ${g.tone === "night" ? styles.toneNight : styles.toneDay}`}
        >
          <h3 className={styles.dayPartTitle}>{g.title}</h3>
          <ul className={styles.dayList}>
            {g.items.map((item) => (
              <li key={`${item.time}-${item.title}`} className={styles.dayItem}>
                <span className={styles.dayTime}>{item.time}</span>
                <span className={item.star ? styles.dayStar : undefined}>{item.title}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function Rundown({ rundown }: { rundown: NonNullable<EventDetail["rundown"]> }) {
  return (
    <section id="rundown" aria-labelledby="rundown-title" className={styles.section}>
      <h2 id="rundown-title" className={`${styles.sectionTitle} ${styles.iceText}`}>
        {rundown.title}
      </h2>
      {rundown.groups.length === 1 ? (
        <Timeline group={rundown.groups[0]} />
      ) : (
        <DayParts groups={rundown.groups} />
      )}
    </section>
  );
}
