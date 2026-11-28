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
 * Beberapa mitra tampil berjajar dalam satu baris.
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
  const partners = competition.collaboration ?? [];
  if (partners.length === 0) return null;

  const style: CSSProperties | undefined = variant === "mobile" ? { top: y } : undefined;
  const names = partners.map((p) => p.name).join(" & ");

  return (
    <section
      aria-label={`In collaboration with ${names}`}
      className={`${styles.collab} ${variant === "mobile" ? styles.mobile : styles.desktop}`}
      style={style}
    >
      <p className={styles.label}>In collaboration with</p>
      <ul className={`${styles.cards} ${partners.length > 1 ? styles.multi : ""}`}>
        {partners.map((p) => {
          const logo = (
            <Image
              src={p.logoSrc}
              alt={p.name}
              fill
              sizes={variant === "mobile" ? "200px" : "360px"}
              className={styles.logo}
            />
          );
          return (
            <li key={p.name}>
              {p.href ? (
                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.card} ${styles.clickable}`}
                  aria-label={`${p.name} (opens website in a new tab)`}
                >
                  {logo}
                </a>
              ) : (
                <div className={styles.card}>{logo}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
