import Image from "next/image";
import type { CSSProperties } from "react";
import type { Competition } from "@/features/competition/types";
import styles from "@/features/competition/Collaboration.module.css";

/**
 * "In collaboration with <mitra>" di bawah hero halaman lomba.
 *
 * Logo memakai berkas yang sama dengan bagian sponsor di landing
 * (public/sponsors), di atas kartu putih seperti di sana supaya logo
 * berwarna gelap (KAI) tetap terbaca di latar biru tua.
 *
 * mobile   diposisikan absolut di kanvas 393px pada Y dari mobileLayout()
 * desktop  alur biasa, baris terakhir kolom hero (setelah tombol)
 *
 * Tidak dirender kalau lomba tidak punya collaboration.
 */
export default function Collaboration({
  competition,
  variant,
  y,
}: {
  competition: Competition;
  variant: "desktop" | "mobile";
  /** Mobile: posisi Y di kanvas. */
  y?: number;
}) {
  const collab = competition.collaboration;
  if (!collab) return null;

  const logo = (
    <Image
      src={collab.logoSrc}
      alt={collab.name}
      fill
      sizes={variant === "mobile" ? "200px" : "360px"}
      className={styles.logo}
    />
  );

  const style: CSSProperties | undefined = variant === "mobile" ? { top: y } : undefined;

  return (
    <section
      aria-label={`In collaboration with ${collab.name}`}
      className={`${styles.collab} ${variant === "mobile" ? styles.mobile : styles.desktop}`}
      style={style}
    >
      <p className={styles.label}>In collaboration with</p>
      {collab.href ? (
        <a
          href={collab.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.card} ${styles.clickable}`}
          aria-label={`${collab.name} (opens website in a new tab)`}
        >
          {logo}
        </a>
      ) : (
        <div className={styles.card}>{logo}</div>
      )}
    </section>
  );
}
