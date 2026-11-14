import Image from "next/image";
import Link from "next/link";
import type { EventDetail } from "@/features/events/types";
import DetailButton from "@/features/events/detail/DetailButton";
import styles from "@/features/events/detail/EventDetail.module.css";

/**
 * Hero: foto kegiatan selebar layar, memudar ke navy di bawah, dengan judul
 * EXCRATCH bergradient es seperti judul section di /event.
 * Foto ini elemen terbesar di layar pertama (LCP), jadi dimuat paling awal.
 */
export default function DetailHero({ detail }: { detail: EventDetail }) {
  return (
    <header className={styles.hero}>
      <Image
        src={detail.hero.src}
        alt={detail.hero.alt}
        fill
        sizes="100vw"
        loading="eager"
        fetchPriority="high"
        className={styles.heroImage}
        style={{ objectFit: "cover", objectPosition: detail.hero.position ?? "50% 50%" }}
      />
      <div className={styles.container}>
        <div className={styles.heroBody}>
          <nav aria-label="Breadcrumb" className={styles.crumb}>
            <Link href="/event">Event</Link> / {detail.name}
          </nav>
          <h1 className={`${styles.heroTitle} ${styles.iceText}`}>{detail.name}</h1>
          <p className={styles.tagline}>{detail.tagline}</p>
          <p className={styles.heroSummary}>{detail.summary}</p>
          <div className={styles.ctas}>
            {detail.ctas.map((cta, i) => (
              <DetailButton key={cta.label} cta={cta} variant={i === 0 ? "fill" : "line"} />
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
