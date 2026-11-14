import type { SchoolVisit } from "@/features/events/types";
import styles from "@/features/events/detail/EventDetail.module.css";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Asia/Jakarta",
});

/**
 * Jadwal kunjungan sekolah Inspirates. Status (selesai / hari ini / akan
 * datang) dihitung di server terhadap tanggal hari ini di WIB. Halaman
 * di-regenerate tiap jam (ISR), jadi statusnya ikut berganti tanpa JS.
 */
export default function SchoolVisits({ visits, today }: { visits: SchoolVisit[]; today: string }) {
  return (
    <section id="jadwal" aria-labelledby="jadwal-title" className={styles.section}>
      <h2 id="jadwal-title" className={`${styles.sectionTitle} ${styles.iceText}`}>
        Jadwal kunjungan sekolah
      </h2>
      <ol className={styles.visits}>
        {visits.map((v) => {
          const status = v.date < today ? "done" : v.date === today ? "today" : "next";
          const label = { done: "Selesai", today: "Hari ini", next: "Akan datang" }[status];
          const pill = { done: styles.pillDone, today: styles.pillToday, next: styles.pillNext }[status];
          const row = status === "done" ? styles.visitDone : status === "today" ? styles.visitToday : "";
          return (
            <li key={`${v.date}-${v.school}`} className={`${styles.visit} ${row}`}>
              <time dateTime={v.date} className={styles.visitDate}>
                {dateFmt.format(new Date(`${v.date}T12:00:00+07:00`))}
              </time>
              <span className={styles.visitSchool}>
                {v.school}
                <span className={styles.visitTime}>{v.time} WIB</span>
              </span>
              <span className={`${styles.pill} ${pill}`}>{label}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
