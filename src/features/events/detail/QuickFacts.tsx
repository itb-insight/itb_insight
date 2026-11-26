import type { CSSProperties } from "react";
import type { EventDetail } from "@/features/events/types";
import styles from "@/features/events/detail/EventDetail.module.css";

/**
 * Info cepat: tanggal, waktu, lokasi, siapa, tiket, registrasi, kuota.
 * Event yang sudah selesai (done) mendapat baris "Status" setelah tanggal.
 * Baris yang datanya kosong tidak tampil.
 */
export default function QuickFacts({ facts, done }: { facts: EventDetail["facts"]; done?: boolean }) {
  const all: { label: string; value?: string; icon?: string }[] = [
    { label: "Tanggal", value: facts.date, icon: "/events/icon-date.svg" },
    { label: "Status", value: done ? "Sudah dilaksanakan" : undefined },
    { label: "Waktu", value: facts.time },
    { label: "Lokasi", value: facts.venue, icon: "/events/icon-pin.svg" },
    { label: "Untuk", value: facts.audience },
    { label: "Tiket", value: facts.ticket },
    { label: "Registrasi", value: facts.registration },
    { label: "Kuota", value: facts.quota },
  ];
  const rows = all.filter((r): r is typeof r & { value: string } => Boolean(r.value));

  // 6 info -> 3 kolom x 2 baris. 7 info -> 4 kolom, "Waktu" (dua sesi,
  // teks terpanjang) selebar 2 sel, jadi tetap 2 baris penuh. 4 info -> 4 kolom.
  const seven = rows.length === 7;
  const cols = seven || rows.length === 4 ? 4 : 3;

  return (
    <section aria-label="Info cepat" className={styles.section}>
      <dl className={styles.facts} style={{ "--cols": cols } as CSSProperties}>
        {rows.map((r) => (
          <div
            key={r.label}
            className={`${styles.fact} ${seven && r.label === "Waktu" ? styles.factWide : ""}`}
          >
            <dt className={styles.factLabel}>
              {r.icon ? (
                // SVG: next/image tidak mengoptimalkan SVG, <img> biasa sudah tepat
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.icon} alt="" aria-hidden="true" className={styles.factIcon} />
              ) : null}
              {r.label}
            </dt>
            <dd className={styles.factValue}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
