import Link from "next/link";
import type { DetailCta } from "@/features/events/types";
import styles from "@/features/events/detail/EventDetail.module.css";

/**
 * Tombol halaman detail. Tiga jenis tujuan:
 *   "#anchor"   lompat di halaman yang sama (<a> biasa)
 *   "/rute"     halaman lain di situs (next/link, prefetch)
 *   external    situs lain, dibuka di tab baru
 */
export default function DetailButton({
  cta,
  variant,
}: {
  cta: DetailCta;
  variant: "fill" | "line";
}) {
  const className = `${styles.btn} ${variant === "fill" ? styles.btnFill : styles.btnLine}`;

  if (cta.external) {
    return (
      <a href={cta.href} className={className} target="_blank" rel="noopener noreferrer">
        {cta.label}
        <span aria-hidden="true">↗</span>
        <span className={styles.srOnly}>(buka di tab baru)</span>
      </a>
    );
  }

  if (cta.href.startsWith("#")) {
    return (
      <a href={cta.href} className={className}>
        {cta.label}
      </a>
    );
  }

  return (
    <Link href={cta.href} className={className}>
      {cta.label}
    </Link>
  );
}
