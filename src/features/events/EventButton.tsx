import type { CSSProperties } from "react";
import type { Box } from "@/features/events/types";
import { u } from "@/features/events/scale";
import styles from "@/features/events/EventButton.module.css";

/**
 * Tombol section event dengan state hover dari Figma.
 * Spesifikasi warna dan alasannya ada di EventButton.module.css.
 *
 * Murni CSS (:hover), bukan Client Component — tidak menambah JavaScript ke
 * halaman, dan tetap berfungsi kalau JavaScript gagal dimuat (PRD ACS-06).
 *
 * href null = event belum dibuka (Coming Soon): dirender sebagai teks
 * biasa, bukan tautan, tanpa state hover.
 */
export default function EventButton({
  box,
  href,
  label,
  ariaLabel,
}: {
  box: Box;
  href: string | null;
  label: string;
  ariaLabel: string;
}) {
  const style = {
    left: u(box.x),
    top: u(box.y),
    width: u(box.w),
    height: u(box.h),
    borderRadius: u(12),
    "--border": u(4),
    // radius bagian dalam = radius luar - tebal tepi
    "--radius-inner": u(8),
    fontFamily: "var(--font-primary)",
    fontSize: u(16),
    fontWeight: 400,
    lineHeight: u(20),
  } as CSSProperties;

  if (href === null) {
    return (
      <span aria-disabled="true" className={`${styles.button} ${styles.disabled}`} style={style}>
        {label}
      </span>
    );
  }

  return (
    <a href={href} aria-label={ariaLabel} className={styles.button} style={style}>
      {label}
    </a>
  );
}
