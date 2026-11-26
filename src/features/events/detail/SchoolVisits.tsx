import Image from "next/image";
import type { SchoolVisit } from "@/features/events/types";
import styles from "@/features/events/detail/EventDetail.module.css";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Asia/Jakarta",
});

/**
 * Kunjungan sekolah Inspirates: satu kartu per sekolah dengan foto bersama
 * (photo) dan thumbnail kegiatan lain (photos). Status (selesai / hari ini /
 * akan datang) dihitung di server terhadap tanggal hari ini di WIB; halaman
 * di-regenerate tiap jam (ISR), jadi statusnya ikut berganti tanpa JS.
 */
export default function SchoolVisits({ visits, today }: { visits: SchoolVisit[]; today: string }) {
  const allDone = visits.every((v) => v.date < today);
  return (
    <section id="jadwal" aria-labelledby="jadwal-title" className={styles.section}>
      <h2 id="jadwal-title" className={`${styles.sectionTitle} ${styles.iceText}`}>
        {allDone ? "Sekolah yang dikunjungi" : "Jadwal kunjungan sekolah"}
      </h2>
      <ol className={styles.schools}>
        {visits.map((v) => {
          const status = v.date < today ? "done" : v.date === today ? "today" : "next";
          const label = { done: "Selesai", today: "Hari ini", next: "Akan datang" }[status];
          const pill = { done: styles.pillDone, today: styles.pillToday, next: styles.pillNext }[status];
          return (
            <li
              key={`${v.date}-${v.school}`}
              className={`${styles.school} ${status === "today" ? styles.visitToday : ""}`}
            >
              {v.photo ? (
                <div className={styles.schoolPhoto}>
                  <Image
                    src={v.photo.src}
                    alt={v.photo.alt}
                    fill
                    sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 380px"
                    style={{ objectFit: "cover", objectPosition: v.photo.position ?? "50% 50%" }}
                  />
                </div>
              ) : null}
              <div className={styles.schoolBody}>
                <div className={styles.schoolHead}>
                  <time dateTime={v.date} className={styles.visitDate}>
                    {dateFmt.format(new Date(`${v.date}T12:00:00+07:00`))}
                  </time>
                  <span className={`${styles.pill} ${pill}`}>{label}</span>
                </div>
                <h3 className={styles.visitSchool}>{v.school}</h3>
                {v.time ? <span className={styles.visitTime}>{v.time} WIB</span> : null}
                {v.photos?.length ? (
                  <ul className={styles.schoolThumbs} aria-label={`Dokumentasi lain di ${v.school}`}>
                    {v.photos.map((p) => (
                      <li key={p.src} className={styles.schoolThumb}>
                        <Image
                          src={p.src}
                          alt={p.alt}
                          fill
                          sizes="120px"
                          style={{ objectFit: "cover", objectPosition: p.position ?? "50% 50%" }}
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
